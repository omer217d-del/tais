import { useListPlugins, useTogglePlugin, useDeletePlugin, getListPluginsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Puzzle, ShieldAlert, Zap, Play, Trash2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PluginsPage() {
  const queryClient = useQueryClient();
  const { data: plugins, isLoading } = useListPlugins({ query: { queryKey: getListPluginsQueryKey() } });
  
  const togglePlugin = useTogglePlugin();
  const deletePlugin = useDeletePlugin();

  const handleToggle = (id: number) => {
    togglePlugin.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPluginsQueryKey() })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Uninstall this plugin?")) {
      deletePlugin.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPluginsQueryKey() })
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto font-mono">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Puzzle className="text-primary" size={24} />
          <h1 className="text-2xl font-bold tracking-tight text-primary">PLUGINS</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={14} /> INSTALL PLUGIN
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full bg-card/50 rounded-lg" />
          ))
        ) : plugins?.length === 0 ? (
          <div className="col-span-full text-center p-12 border border-dashed border-border rounded-lg bg-card/10">
            <Puzzle size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No plugins installed</h3>
            <p className="text-sm text-muted-foreground mt-2">Install plugins to add new triggers and actions.</p>
          </div>
        ) : (
          <AnimatePresence>
            {plugins?.map((plugin, i) => (
              <motion.div
                key={plugin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <Card className={`h-full border border-border/50 ${plugin.enabled ? 'bg-card/80' : 'bg-card/30 opacity-70'}`}>
                  <CardHeader className="pb-2 flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {plugin.name}
                        <Badge variant="outline" className="text-[10px] ml-2 bg-background/50 border-border">v{plugin.version}</Badge>
                      </CardTitle>
                      <CardDescription className="text-xs mt-1 text-muted-foreground/80">
                        {plugin.pluginId} • by {plugin.author || 'Unknown'}
                      </CardDescription>
                    </div>
                    <Switch 
                      checked={plugin.enabled} 
                      onCheckedChange={() => handleToggle(plugin.id)} 
                      disabled={togglePlugin.isPending}
                    />
                  </CardHeader>
                  <CardContent className="pt-2 flex flex-col justify-between">
                    <p className="text-sm text-foreground/80 mb-4 h-10 line-clamp-2">
                      {plugin.description}
                    </p>
                    
                    <div className="space-y-3">
                      {plugin.manifest.permissions.length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <ShieldAlert size={14} className="text-destructive/80 mt-0.5 shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {plugin.manifest.permissions.map(p => (
                              <span key={p} className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-[10px]">{p.split('.').pop()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Zap size={10}/> TRIGGERS ({plugin.manifest.triggers.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {plugin.manifest.triggers.slice(0, 3).map(t => (
                              <span key={t} className="text-xs bg-yellow-500/10 text-yellow-500/80 px-1.5 py-0.5 rounded border border-yellow-500/20">{t}</span>
                            ))}
                            {plugin.manifest.triggers.length > 3 && <span className="text-xs text-muted-foreground">+{plugin.manifest.triggers.length - 3} more</span>}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Play size={10}/> ACTIONS ({plugin.manifest.actions.length})</div>
                          <div className="flex flex-wrap gap-1">
                            {plugin.manifest.actions.slice(0, 3).map(a => (
                              <span key={a} className="text-xs bg-green-500/10 text-green-500/80 px-1.5 py-0.5 rounded border border-green-500/20">{a}</span>
                            ))}
                            {plugin.manifest.actions.length > 3 && <span className="text-xs text-muted-foreground">+{plugin.manifest.actions.length - 3} more</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                          onClick={() => handleDelete(plugin.id)}
                          disabled={deletePlugin.isPending}
                        >
                          <Trash2 size={12} /> UNINSTALL
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
