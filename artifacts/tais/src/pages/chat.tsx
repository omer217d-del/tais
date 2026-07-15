import { useState, useRef, useEffect } from "react";
import { useListChatMessages, useSendChatMessage, useClearChatHistory, getListChatMessagesQueryKey, ChatMessage, ChatResponse } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Terminal, Send, Trash2, Zap, Settings, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton, Spinner } from "@/components/ui/skeleton";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  
  const { data: messages, isLoading } = useListChatMessages({ limit: 100 }, { query: { queryKey: getListChatMessagesQueryKey({ limit: 100 }) } });
  
  const sendMessage = useSendChatMessage();
  const clearHistory = useClearChatHistory();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    
    sendMessage.mutate({ data: { content } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
      }
    });
  };

  const handleClear = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() });
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur z-10">
        <div>
          <h1 className="text-xl font-mono font-bold text-primary flex items-center gap-2">
            <Terminal size={20} />
            TAIS_TERMINAL
          </h1>
          <p className="text-xs text-muted-foreground font-mono">STATUS: ONLINE | WAITING FOR INPUT</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClear} title="Clear Terminal">
          <Trash2 size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 font-mono" ref={scrollRef}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 bg-primary/5" />
            <Skeleton className="h-16 w-3/4 ml-auto bg-primary/10" />
            <Skeleton className="h-24 w-1/2 bg-primary/5" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <Terminal size={48} className="mb-4" />
            <p>System initialized.</p>
            <p>Type a natural language command to create an automation.</p>
            <p className="mt-4 text-xs">Example: "Şarj %20 olunca bana sesli haber ver"</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {(Array.isArray(messages) ? messages : []).map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-primary/20 border border-primary/50 text-primary-foreground px-4 py-3 rounded-lg rounded-tr-none shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                      <span className="text-primary font-bold">{'> '}</span>
                      {msg.content}
                    </div>
                  ) : (
                    <div className="bg-card border border-border px-4 py-3 rounded-lg rounded-tl-none relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50"></div>
                      <div className="text-foreground whitespace-pre-wrap">{msg.content}</div>
                      
                      {msg.automationJson && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs text-primary mb-2 flex items-center gap-1">
                            <Zap size={12} /> AUTOMATION CREATED
                          </p>
                          <Card className="bg-black/40 border-primary/30">
                            <CardContent className="p-3 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                                  {(msg.automationJson as any)?.trigger?.type || 'TRIGGER'}
                                </Badge>
                                <span className="text-muted-foreground text-xs">→</span>
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                                  {(msg.automationJson as any)?.action?.type || 'ACTION'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                      
                      {msg.processingTimeMs && (
                        <div className="text-[10px] text-muted-foreground mt-2 text-right opacity-50">
                          [PROCESSED IN {msg.processingTimeMs}MS]
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {sendMessage.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-card border border-border px-4 py-3 rounded-lg rounded-tl-none relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50 animate-pulse"></div>
              <div className="flex items-center gap-2 text-primary font-mono text-sm">
                <Spinner /> <span className="animate-pulse">PROCESSING...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-background/80 backdrop-blur border-t border-border sticky bottom-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2 items-end relative"
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold select-none pointer-events-none">
            {'>'}
          </div>
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type command..." 
            className="flex-1 bg-card/50 border-primary/30 focus-visible:border-primary pl-8 text-primary shadow-[0_0_15px_rgba(0,255,255,0.05)] focus-visible:shadow-[0_0_15px_rgba(0,255,255,0.2)]"
            disabled={sendMessage.isPending}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || sendMessage.isPending}
            className={input.trim() ? "animate-pulse shadow-[0_0_15px_rgba(0,255,255,0.4)]" : ""}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
