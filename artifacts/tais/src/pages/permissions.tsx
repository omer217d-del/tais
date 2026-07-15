import { useListPermissions, useUpdatePermission, getListPermissionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Shield, ShieldAlert, ShieldCheck, MapPin, Camera, Bluetooth, Smartphone, Database, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const { data: permissions, isLoading } = useListPermissions({ query: { queryKey: getListPermissionsQueryKey() } });
  
  const updatePermission = useUpdatePermission();

  const handleToggle = (id: number, granted: boolean) => {
    updatePermission.mutate({ id, data: { granted } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPermissionsQueryKey() });
      }
    });
  };

  // Group permissions by category
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'location': return <MapPin size={18} className="text-blue-400" />;
      case 'sensor': return <Activity size={18} className="text-green-400" />;
      case 'connectivity': return <Bluetooth size={18} className="text-cyan-400" />;
      case 'media': return <Camera size={18} className="text-purple-400" />;
      case 'storage': return <Database size={18} className="text-yellow-400" />;
      case 'system': return <Smartphone size={18} className="text-orange-400" />;
      default: return <Shield size={18} className="text-primary" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'location': return "border-blue-500/30 bg-blue-500/5";
      case 'sensor': return "border-green-500/30 bg-green-500/5";
      case 'connectivity': return "border-cyan-500/30 bg-cyan-500/5";
      case 'media': return "border-purple-500/30 bg-purple-500/5";
      case 'storage': return "border-yellow-500/30 bg-yellow-500/5";
      case 'system': return "border-orange-500/30 bg-orange-500/5";
      default: return "border-primary/30 bg-primary/5";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto font-mono">
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <Shield className="text-primary" size={24} />
        <h1 className="text-2xl font-bold tracking-tight text-primary">SYSTEM PERMISSIONS</h1>
      </div>

      <div className="bg-card/50 border border-border p-4 rounded-lg mb-8 text-sm text-muted-foreground flex gap-3">
        <ShieldAlert className="text-yellow-500 shrink-0 mt-0.5" size={18} />
        <p>
          TAIS requires specific Android permissions to execute hardware triggers and actions. 
          Permissions marked as <span className="text-destructive font-bold">REQUIRED</span> are necessary for core functionality.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full bg-card/50" />
          <Skeleton className="h-48 w-full bg-card/50" />
        </div>
      ) : groupedPermissions ? (
        <div className="space-y-8">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 uppercase">
                {getCategoryIcon(category)} {category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {((Array.isArray(perms) ? perms : [])).map(perm => (
                  <Card key={perm.id} className={`border ${getCategoryColor(category)} transition-colors`}>
                    <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground">{perm.name}</h3>
                            {perm.granted ? (
                              <ShieldCheck size={14} className="text-green-500" />
                            ) : (
                              <ShieldAlert size={14} className="text-destructive" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-sans mb-2 font-mono bg-black/40 px-1.5 py-0.5 rounded inline-block border border-white/5">
                            {perm.androidPermission}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {perm.description}
                          </p>
                        </div>
                        <Switch 
                          checked={perm.granted} 
                          onCheckedChange={(c) => handleToggle(perm.id, c)}
                          disabled={updatePermission.isPending}
                        />
                      </div>
                      
                      <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                        <Badge variant={perm.required ? "destructive" : "secondary"} className="text-[9px] py-0 px-1.5">
                          {perm.required ? "CORE REQUIRED" : "OPTIONAL"}
                        </Badge>
                        <span className={`text-[10px] font-bold ${perm.granted ? 'text-green-500' : 'text-destructive'}`}>
                          {perm.granted ? 'GRANTED' : 'DENIED'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 text-muted-foreground">No permissions registered.</div>
      )}
    </div>
  );
}
