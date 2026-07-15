import { useState, useRef, useEffect } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey, AppSettingsUpdateTheme, AppSettingsUpdateLogLevel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Sliders, Moon, Cpu, Database, Activity, Code2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  
  const updateSettings = useUpdateSettings();

  // Local state for debounced slider values
  const [tempParams, setTempParams] = useState({
    temperature: 0,
    maxTokens: 0,
    contextLength: 0
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (settings) {
      setTempParams({
        temperature: settings.aiTemperature,
        maxTokens: settings.aiMaxTokens,
        contextLength: settings.aiContextLength
      });
    }
  }, [settings]);

  const handleToggle = (key: string, value: any) => {
    updateSettings.mutate({ data: { [key]: value } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() })
    });
  };

  const handleSliderChange = (key: keyof typeof tempParams, value: number) => {
    setTempParams(prev => ({ ...prev, [key]: value }));
    
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    
    saveTimerRef.current = setTimeout(() => {
      let apiKey = "";
      if (key === "temperature") apiKey = "aiTemperature";
      if (key === "maxTokens") apiKey = "aiMaxTokens";
      if (key === "contextLength") apiKey = "aiContextLength";
      
      updateSettings.mutate({ data: { [apiKey]: value } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() })
      });
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64 bg-card/50" />
        <Skeleton className="h-64 w-full bg-card/50" />
        <Skeleton className="h-64 w-full bg-card/50" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto font-mono pb-20">
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <Settings className="text-primary" size={24} />
        <h1 className="text-2xl font-bold tracking-tight text-primary">SYSTEM_CONFIGURATION</h1>
      </div>

      <div className="grid gap-6">
        {/* Core System */}
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu size={18} className="text-primary" /> CORE SYSTEM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Dark Theme</p>
                <p className="text-xs text-muted-foreground mt-1">Force terminal aesthetics</p>
              </div>
              <Switch 
                checked={settings.theme === 'dark'} 
                onCheckedChange={(c) => handleToggle('theme', c ? 'dark' : 'light')} 
              />
            </div>
            
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <div>
                <p className="font-bold flex items-center gap-2">Foreground Service <ShieldCheck size={14} className="text-green-500"/></p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">Keep TAIS running in the background to ensure triggers fire reliably.</p>
              </div>
              <Switch 
                checked={settings.foregroundServiceEnabled} 
                onCheckedChange={(c) => handleToggle('foregroundServiceEnabled', c)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Parameters */}
        <Card className="bg-card/50 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sliders size={100} />
          </div>
          <CardHeader className="pb-6">
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <Sliders size={18} /> LLM PARAMETERS
            </CardTitle>
            <CardDescription className="font-mono text-xs">Tune the local inference engine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 relative z-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">TEMPERATURE</span>
                <Badge variant="outline" className="text-primary border-primary/50">{((tempParams?.temperature || 0).toFixed(2))}</Badge>
              </div>
              <Slider 
                value={[tempParams.temperature]} 
                min={0} max={2} step={0.1}
                onValueChange={([val]) => handleSliderChange('temperature', val)}
              />
              <p className="text-[10px] text-muted-foreground">Controls randomness. Lower is more deterministic, higher is more creative.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">MAX TOKENS</span>
                <Badge variant="outline" className="text-primary border-primary/50">{tempParams.maxTokens}</Badge>
              </div>
              <Slider 
                value={[tempParams.maxTokens]} 
                min={128} max={4096} step={128}
                onValueChange={([val]) => handleSliderChange('maxTokens', val)}
              />
              <p className="text-[10px] text-muted-foreground">Maximum length of generated response.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold">CONTEXT LENGTH</span>
                <Badge variant="outline" className="text-primary border-primary/50">{tempParams.contextLength}</Badge>
              </div>
              <Slider 
                value={[tempParams.contextLength]} 
                min={512} max={8192} step={256}
                onValueChange={([val]) => handleSliderChange('contextLength', val)}
              />
              <p className="text-[10px] text-muted-foreground">Memory size for conversation history. Higher values require more RAM.</p>
            </div>
          </CardContent>
        </Card>

        {/* Developer Mode */}
        <Card className={`border transition-colors ${settings.developerMode ? 'bg-destructive/5 border-destructive/30' : 'bg-card/50 border-border'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg flex items-center gap-2 ${settings.developerMode ? 'text-destructive' : ''}`}>
                <Code2 size={18} /> DEVELOPER MODE
              </CardTitle>
              <Switch 
                checked={settings.developerMode} 
                onCheckedChange={(c) => handleToggle('developerMode', c)} 
                className="data-[state=checked]:bg-destructive"
              />
            </div>
          </CardHeader>
          
          {settings.developerMode && (
            <CardContent className="space-y-6 pt-2 border-t border-destructive/20 mt-2">
              <div className="flex items-start gap-3 text-xs text-destructive/80 mb-4 bg-destructive/10 p-3 rounded border border-destructive/20">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>Warning: Modifying developer settings can cause system instability or excessive battery drain.</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Ignore Battery Optimizations</p>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">Prevent Android from killing TAIS to save battery.</p>
                </div>
                <Switch 
                  checked={settings.batteryOptimizationIgnored} 
                  onCheckedChange={(c) => handleToggle('batteryOptimizationIgnored', c)} 
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <p className="font-bold text-sm">Log Level</p>
                <div className="flex flex-wrap gap-2">
                  {['debug', 'info', 'warn', 'error'].map((lvl) => (
                    <Button 
                      key={lvl}
                      variant={settings.logLevel === lvl ? "default" : "outline"} 
                      size="sm"
                      className={`uppercase text-xs h-8 ${settings.logLevel === lvl && lvl === 'debug' ? 'bg-muted-foreground' : ''}`}
                      onClick={() => handleToggle('logLevel', lvl as AppSettingsUpdateLogLevel)}
                    >
                      {lvl}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
