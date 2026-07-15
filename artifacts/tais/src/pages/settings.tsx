import { useState, useRef, useEffect } from "react";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
  AppSettingsUpdateLogLevel,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Cpu, Database, Activity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });

  const updateSettings = useUpdateSettings();

  const [tempParams, setTempParams] = useState({
    temperature: 0.7,
    maxTokens: 512,
    contextLength: 2048,
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (settings) {
      setTempParams({
        temperature: settings.aiTemperature,
        maxTokens: settings.aiMaxTokens,
        contextLength: settings.aiContextLength,
      });
    }
  }, [settings]);

  const handleToggle = (key: string, value: unknown) => {
    updateSettings.mutate(
      { data: { [key]: value } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() }),
        onError: () => toast.error("Ayar güncellenemedi."),
      }
    );
  };

  const handleSliderChange = (
    key: "temperature" | "maxTokens" | "contextLength",
    value: number
  ) => {
    setTempParams((prev) => ({ ...prev, [key]: value }));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const apiKeyMap = {
        temperature: "aiTemperature",
        maxTokens: "aiMaxTokens",
        contextLength: "aiContextLength",
      };
      updateSettings.mutate(
        { data: { [apiKeyMap[key]]: value } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
            toast.success("Ayar kaydedildi.");
          },
          onError: () => toast.error("Ayar kaydedilemedi."),
        }
      );
    }, 900);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-1">
        <Settings className="text-primary shrink-0" size={22} />
        <h1 className="text-xl font-mono font-bold tracking-tight text-foreground">Ayarlar</h1>
      </div>

      {/* Core System */}
      <Card className="bg-card border-border/60">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
            <Cpu size={15} className="text-primary" /> Sistem
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Koyu Tema</p>
              <p className="text-xs text-muted-foreground mt-0.5">Karanlık arayüz modunu kullan</p>
            </div>
            <Switch
              checked={settings.theme === "dark"}
              onCheckedChange={(c) => handleToggle("theme", c ? "dark" : "light")}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Arka Plan Servisi</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                TAIS'ı arka planda çalıştırmaya devam et
              </p>
            </div>
            <Switch
              checked={settings.backgroundServiceEnabled}
              onCheckedChange={(c) => handleToggle("backgroundServiceEnabled", c)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Önyükleme Otomatik Başlatma</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cihaz yeniden başladığında TAIS'ı otomatik aç
              </p>
            </div>
            <Switch
              checked={settings.autoStartOnBoot}
              onCheckedChange={(c) => handleToggle("autoStartOnBoot", c)}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Parameters */}
      <Card className="bg-card border-border/60">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
            <Database size={15} className="text-primary" /> AI Parametreleri
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-6">
          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Sıcaklık</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Yanıt yaratıcılığı (0 = deterministik, 1 = rastgele)
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                {tempParams.temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[tempParams.temperature]}
              onValueChange={([v]) => handleSliderChange("temperature", v)}
              className="py-1"
            />
          </div>

          {/* Max tokens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Maks. Token</p>
                <p className="text-xs text-muted-foreground mt-0.5">Yanıt başına maksimum token sayısı</p>
              </div>
              <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                {tempParams.maxTokens}
              </span>
            </div>
            <Slider
              min={64}
              max={4096}
              step={64}
              value={[tempParams.maxTokens]}
              onValueChange={([v]) => handleSliderChange("maxTokens", v)}
              className="py-1"
            />
          </div>

          {/* Context length */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Bağlam Uzunluğu</p>
                <p className="text-xs text-muted-foreground mt-0.5">Model bağlam penceresi (token)</p>
              </div>
              <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                {tempParams.contextLength}
              </span>
            </div>
            <Slider
              min={512}
              max={8192}
              step={512}
              value={[tempParams.contextLength]}
              onValueChange={([v]) => handleSliderChange("contextLength", v)}
              className="py-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Developer Mode */}
      <Card className={`bg-card border-border/60 ${settings.developerMode ? "border-destructive/30" : ""}`}>
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
              <Activity size={15} className="text-destructive" /> Geliştirici Modu
            </CardTitle>
            <Switch
              checked={settings.developerMode}
              onCheckedChange={(c) => handleToggle("developerMode", c)}
              className="data-[state=checked]:bg-destructive"
            />
          </div>
        </CardHeader>

        {settings.developerMode && (
          <CardContent className="px-5 pb-5 space-y-5 border-t border-destructive/15 pt-4">
            <div className="flex items-start gap-2.5 text-xs text-destructive/80 bg-destructive/8 p-3 rounded-lg border border-destructive/20">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p>Uyarı: Geliştirici ayarlarını değiştirmek sistem kararsızlığına neden olabilir.</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Pil Optimizasyonunu Yoksay</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Android'in TAIS'ı pil tasarrufu için kapatmasını engelle
                </p>
              </div>
              <Switch
                checked={settings.batteryOptimizationIgnored}
                onCheckedChange={(c) => handleToggle("batteryOptimizationIgnored", c)}
              />
            </div>

            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-foreground">Günlük Seviyesi</p>
              <div className="flex flex-wrap gap-2">
                {(["debug", "info", "warn", "error"] as AppSettingsUpdateLogLevel[]).map((lvl) => (
                  <Button
                    key={lvl}
                    variant={settings.logLevel === lvl ? "default" : "outline"}
                    size="sm"
                    className="uppercase text-xs h-8 rounded-lg font-mono"
                    onClick={() => handleToggle("logLevel", lvl)}
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
  );
}
