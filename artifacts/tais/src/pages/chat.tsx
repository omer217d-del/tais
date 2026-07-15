import { useState, useRef, useEffect } from "react";
import { useListChatMessages, useSendChatMessage, useClearChatHistory, getListChatMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Terminal, Send, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton, Spinner } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");

  const { data: messages, isLoading } = useListChatMessages(
    { limit: 100 },
    { query: { queryKey: getListChatMessagesQueryKey({ limit: 100 }) } }
  );

  const sendMessage = useSendChatMessage();
  const clearHistory = useClearChatHistory();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    setInput("");

    sendMessage.mutate(
      { data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
          inputRef.current?.focus();
        },
        onError: (err: unknown) => {
          const msg = (err as any)?.message ?? "Mesaj gönderilemedi. Sunucu bağlantısını kontrol edin.";
          toast.error("Hata", { description: msg });
          setInput(content); // restore input on error
        },
      }
    );
  };

  const handleClear = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
        toast.success("Konuşma geçmişi temizlendi.");
      },
      onError: () => {
        toast.error("Geçmiş temizlenemedi.");
      },
    });
  };

  const msgList = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <div>
          <h1 className="text-lg font-mono font-bold text-primary flex items-center gap-2">
            <Terminal size={18} />
            TAIS
          </h1>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {sendMessage.isPending ? "İşleniyor..." : "Bağlı · Komut bekleniyor"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          disabled={clearHistory.isPending}
          title="Geçmişi temizle"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          {clearHistory.isPending ? <Spinner className="h-4 w-4" /> : <Trash2 size={16} />}
        </Button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 font-mono" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4 pt-2">
            <Skeleton className="h-14 w-3/4" />
            <Skeleton className="h-14 w-3/4 ml-auto" />
            <Skeleton className="h-20 w-1/2" />
          </div>
        ) : msgList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground opacity-60 pb-8">
            <Terminal size={40} strokeWidth={1.5} />
            <p className="text-sm">Sistem hazır.</p>
            <p className="text-xs text-center max-w-xs leading-relaxed">
              Doğal dilde bir komut yazın; TAIS otomatik bir kural oluşturur.
            </p>
            <p className="text-xs mt-2 bg-secondary/60 px-3 py-1.5 rounded-lg border border-border/50">
              Örnek: "Saat 10:00'da sesli bildirim gönder"
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {msgList.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[88%] space-y-1.5 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  {/* Role label */}
                  <span className="text-[10px] font-mono text-muted-foreground px-1">
                    {msg.role === "user" ? "SEN" : "TAIS"}
                  </span>

                  {msg.role === "user" ? (
                    /* User bubble */
                    <div className="bg-primary/15 border border-primary/25 text-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    /* Assistant bubble */
                    <div className="space-y-2">
                      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed text-foreground/90">
                        {msg.content}
                      </div>

                      {/* Automation card */}
                      {msg.automationJson && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Card className="bg-primary/8 border-primary/20 overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Zap size={12} className="text-primary" />
                                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                                  Otomasyon Oluşturuldu
                                </span>
                              </div>
                              <p className="text-xs text-foreground/80 font-semibold mb-2">
                                {(msg.automationJson as any)?.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px]">
                                <Badge variant="secondary" className="font-mono px-1.5 py-0.5 text-[10px]">
                                  {(msg.automationJson as any)?.trigger?.type}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                                <Badge variant="secondary" className="font-mono px-1.5 py-0.5 text-[10px]">
                                  {(msg.automationJson as any)?.action?.type}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}

                      {/* Processing time */}
                      {msg.processingTimeMs != null && (
                        <p className="text-[10px] text-muted-foreground/60 px-1">
                          {msg.processingTimeMs} ms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        {sendMessage.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-2 text-primary text-sm">
                <Spinner />
                <span className="text-muted-foreground text-xs">İşleniyor...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 bg-background/90 backdrop-blur-sm border-t border-border/60 sticky bottom-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-center"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 font-mono text-sm select-none pointer-events-none">
              &gt;
            </span>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Komut yazın..."
              className="pl-8 bg-card/60 border-border/70 focus-visible:border-primary/60 focus-visible:ring-primary/20 font-mono text-sm rounded-xl"
              disabled={sendMessage.isPending}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || sendMessage.isPending}
            className="rounded-xl shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40"
          >
            {sendMessage.isPending ? <Spinner className="text-primary-foreground" /> : <Send size={16} />}
          </Button>
        </form>
      </div>
    </div>
  );
}
