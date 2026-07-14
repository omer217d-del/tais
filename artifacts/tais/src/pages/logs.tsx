import { useState } from "react";
import { useListLogs, useGetLogStats, useClearLogs, getListLogsQueryKey, getGetLogStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Trash2, Search, Filter, AlertCircle, Info, Bug, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function LogsPage() {
  const queryClient = useQueryClient();
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  
  // Use 'any' type for params since generated types might be strict and we are passing null sometimes.
  const queryParams: any = { limit: 100 };
  if (filterLevel) queryParams.level = filterLevel;

  const { data: logsData, isLoading } = useListLogs(queryParams, { query: { queryKey: getListLogsQueryKey(queryParams), refetchInterval: autoScroll ? 3000 : false } });
  const { data: stats } = useGetLogStats({ query: { queryKey: getGetLogStatsQueryKey() } });
  
  const clearLogs = useClearLogs();

  const handleClear = () => {
    if (confirm("Clear all system logs?")) {
      clearLogs.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListLogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLogStatsQueryKey() });
        }
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return "text-destructive border-destructive/20 bg-destructive/5";
      case 'warn': return "text-yellow-500 border-yellow-500/20 bg-yellow-500/5";
      case 'info': return "text-blue-400 border-blue-400/20 bg-blue-400/5";
      case 'debug': return "text-muted-foreground border-muted/20 bg-muted/5";
      default: return "text-foreground";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle size={14} className="text-destructive" />;
      case 'warn': return <AlertCircle size={14} className="text-yellow-500" />;
      case 'info': return <Info size={14} className="text-blue-400" />;
      case 'debug': return <Bug size={14} className="text-muted-foreground" />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background font-mono relative">
      <div className="p-4 md:p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={24} />
            <h1 className="text-2xl font-bold tracking-tight text-primary">SYSTEM_LOGS</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground hidden sm:flex">
              <span>AUTO-SCROLL</span>
              <Switch checked={autoScroll} onCheckedChange={setAutoScroll} className="data-[state=checked]:bg-primary" />
            </div>
            <Button variant="outline" size="sm" onClick={handleClear} className="border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 size={14} className="mr-2" /> CLEAR
            </Button>
          </div>
        </div>

        {stats && (
          <div className="flex gap-2 text-xs overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setFilterLevel(null)} className={`px-3 py-1 rounded border ${!filterLevel ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-secondary'}`}>ALL ({stats.total})</button>
            <button onClick={() => setFilterLevel('error')} className={`px-3 py-1 rounded border flex items-center gap-1 ${filterLevel === 'error' ? 'bg-destructive/20 border-destructive text-destructive' : 'bg-card border-border text-destructive hover:bg-destructive/10'}`}>ERRORS ({stats.byLevel.error})</button>
            <button onClick={() => setFilterLevel('warn')} className={`px-3 py-1 rounded border flex items-center gap-1 ${filterLevel === 'warn' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-card border-border text-yellow-500 hover:bg-yellow-500/10'}`}>WARNINGS ({stats.byLevel.warn})</button>
            <button onClick={() => setFilterLevel('info')} className={`px-3 py-1 rounded border flex items-center gap-1 ${filterLevel === 'info' ? 'bg-blue-400/20 border-blue-400 text-blue-400' : 'bg-card border-border text-blue-400 hover:bg-blue-400/10'}`}>INFO ({stats.byLevel.info})</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#0a0a0c]">
        {isLoading ? (
          Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full bg-card/20 rounded-none mb-1" />
          ))
        ) : !logsData?.items || logsData.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <Activity size={48} className="mb-4" />
            <p>No log entries found.</p>
          </div>
        ) : (
          <div className="text-[11px] sm:text-xs font-mono">
            {logsData.items.map(log => (
              <div key={log.id} className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-1.5 border-b border-white/5 hover:bg-white/5 transition-colors ${getLevelColor(log.level)}`}>
                <div className="flex items-center gap-2 shrink-0 sm:w-44 text-muted-foreground opacity-70">
                  {getLevelIcon(log.level)}
                  <span>[{format(new Date(log.timestamp), "HH:mm:ss.SSS")}]</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 sm:w-24 uppercase font-bold">
                  {log.level}
                </div>
                <div className="flex-1 break-all">
                  <span className="font-semibold mr-2">{log.source ? `<${log.source}>` : '<system>'}</span>
                  {log.message}
                  {log.automationId && <span className="ml-2 text-[9px] bg-primary/20 text-primary px-1 rounded">AUTO:{log.automationId}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
