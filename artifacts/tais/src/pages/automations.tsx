import {
  useListAutomations,
  useGetAutomationStats,
  useToggleAutomation,
  useDeleteAutomation,
  getListAutomationsQueryKey,
  getGetAutomationStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton, Spinner } from "@/components/ui/skeleton";
import { Trash2, Zap, Clock, Play, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const { data: automations, isLoading } = useListAutomations(
    {},
    { query: { queryKey: getListAutomationsQueryKey({}) } }
  );
  const { data: stats } = useGetAutomationStats({
    query: { queryKey: getGetAutomationStatsQueryKey() },
  });

  const toggleAutomation = useToggleAutomation();
  const deleteAutomation = useDeleteAutomation();

  const handleToggle = (id: number) => {
    toggleAutomation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAutomationStatsQueryKey() });
        },
        onError: () => toast.error("Otomasyon durumu güncellenemedi."),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Bu otomasyonu silmek istediğinizden emin misiniz?")) return;
    deleteAutomation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAutomationStatsQueryKey() });
          toast.success("Otomasyon silindi.");
        },
        onError: () => toast.error("Otomasyon silinemedi."),
      }
    );
  };

  const autoList = Array.isArray(automations) ? automations : [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Zap className="text-primary shrink-0" size={22} />
        <h1 className="text-xl font-mono font-bold tracking-tight text-foreground">
          Otomasyonlar
        </h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Toplam", value: stats.total, color: "text-foreground" },
            { label: "Aktif", value: stats.enabled, color: "text-primary" },
            { label: "Çalıştırma", value: stats.totalExecutions, color: "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="bg-card border-border/60">
              <CardContent className="p-4 flex flex-col items-center text-center gap-0.5">
                <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Automation list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : autoList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Zap size={36} strokeWidth={1.5} />
            <p className="text-sm">Henüz otomasyon yok.</p>
            <p className="text-xs text-center max-w-xs">
              Chat sayfasına giderek doğal dilde bir komut yazın.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {autoList.map((auto) => (
              <motion.div
                key={auto.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="bg-card border-border/60 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-mono font-semibold text-sm text-foreground truncate">
                            {auto.name}
                          </h3>
                          <Badge
                            variant={auto.enabled ? "default" : "secondary"}
                            className="text-[9px] px-1.5 py-0.5 h-4 font-mono uppercase"
                          >
                            {auto.enabled ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-secondary/60 px-2 py-1 rounded-md border border-border/50">
                            <Zap size={12} className="text-primary shrink-0" />
                            <span className="text-[11px] font-mono text-foreground/80">
                              {auto.trigger.type}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-xs">→</span>
                          <div className="flex items-center gap-1.5 bg-secondary/60 px-2 py-1 rounded-md border border-border/50">
                            <Play size={12} className="text-primary shrink-0" />
                            <span className="text-[11px] font-mono text-foreground/80">
                              {auto.action.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BarChart2 size={11} />
                            {auto.executionCount} çalışma
                          </span>
                          {auto.lastExecutedAt && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {format(new Date(auto.lastExecutedAt), "HH:mm")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: controls */}
                      <div className="flex flex-col items-end justify-between gap-4 shrink-0">
                        <Switch
                          checked={auto.enabled}
                          onCheckedChange={() => handleToggle(auto.id)}
                          disabled={toggleAutomation.isPending}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
                          onClick={() => handleDelete(auto.id)}
                          disabled={deleteAutomation.isPending}
                        >
                          {deleteAutomation.isPending ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
