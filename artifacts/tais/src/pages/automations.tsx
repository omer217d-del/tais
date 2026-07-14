import { useState } from "react";
import { 
  useListAutomations, 
  useGetAutomationStats, 
  useToggleAutomation, 
  useDeleteAutomation, 
  getListAutomationsQueryKey,
  getGetAutomationStatsQueryKey,
  TriggerConfigType,
  ActionConfigType
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Zap, Clock, Play, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const { data: automations, isLoading } = useListAutomations({}, { query: { queryKey: getListAutomationsQueryKey({}) } });
  const { data: stats } = useGetAutomationStats({ query: { queryKey: getGetAutomationStatsQueryKey() } });
  
  const toggleAutomation = useToggleAutomation();
  const deleteAutomation = useDeleteAutomation();

  const handleToggle = (id: number) => {
    toggleAutomation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAutomationStatsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this automation?")) {
      deleteAutomation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAutomationStatsQueryKey() });
        }
      });
    }
  };

  const getTriggerIcon = (type: string) => {
    // simplified generic icon
    return <Zap size={14} className="text-yellow-400" />;
  };

  const getActionIcon = (type: string) => {
    // simplified generic icon
    return <Play size={14} className="text-green-400" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto font-mono">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="text-primary" size={24} />
        <h1 className="text-2xl font-bold tracking-tight text-primary">AUTOMATIONS</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-black/20 border-primary/20">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-primary">{stats.total}</span>
              <span className="text-xs text-muted-foreground uppercase mt-1">Total Rules</span>
            </CardContent>
          </Card>
          <Card className="bg-black/20 border-green-500/20">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-green-400">{stats.enabled}</span>
              <span className="text-xs text-muted-foreground uppercase mt-1">Active</span>
            </CardContent>
          </Card>
          <Card className="bg-black/20 border-blue-500/20">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-blue-400">{stats.totalExecutions}</span>
              <span className="text-xs text-muted-foreground uppercase mt-1">Executions</span>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-card/50 rounded-lg" />
          ))
        ) : automations?.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-lg bg-card/10">
            <BarChart2 size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No automations found</h3>
            <p className="text-sm text-muted-foreground mt-2">Go to the chat to create one with natural language.</p>
          </div>
        ) : (
          <AnimatePresence>
            {automations?.map((auto, i) => (
              <motion.div
                key={auto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <Card className={`overflow-hidden border-l-4 transition-all duration-300 ${auto.enabled ? 'border-l-primary bg-card/80' : 'border-l-muted bg-card/30 opacity-70'}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground line-clamp-1">{auto.name}</h3>
                          <Badge variant={auto.enabled ? "success" : "secondary"} className="text-[10px] py-0">
                            {auto.enabled ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-primary/80 bg-primary/5 p-2 rounded border border-primary/10 italic">
                          "{auto.naturalLanguageInput}"
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/5">
                            {getTriggerIcon(auto.trigger.type)}
                            <span className="text-yellow-400/90">{auto.trigger.type}</span>
                          </div>
                          <span className="text-muted-foreground opacity-50">→</span>
                          <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/5">
                            {getActionIcon(auto.action.type)}
                            <span className="text-green-400/90">{auto.action.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between h-full gap-4">
                        <Switch 
                          checked={auto.enabled} 
                          onCheckedChange={() => handleToggle(auto.id)} 
                          disabled={toggleAutomation.isPending}
                        />
                        
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end text-[10px] text-muted-foreground mr-2">
                            <span>RUNS: {auto.executionCount}</span>
                            {auto.lastExecutedAt && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> 
                                {format(new Date(auto.lastExecutedAt), "HH:mm:ss")}
                              </span>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/20 hover:text-destructive h-8 w-8"
                            onClick={() => handleDelete(auto.id)}
                            disabled={deleteAutomation.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
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
