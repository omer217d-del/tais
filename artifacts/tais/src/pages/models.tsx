import { useState } from "react";
import { 
  useGetActiveModel, 
  useListModels, 
  useListSupportedModels, 
  useActivateModel, 
  useRegisterModel, 
  getGetActiveModelQueryKey, 
  getListModelsQueryKey,
  AiModelInputProvider
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, Spinner } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, Download, CheckCircle2, AlertTriangle, Box, HardDrive, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function ModelsPage() {
  const queryClient = useQueryClient();
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);

  // Try to get active model. If it 404s, it means we need the wizard.
  const { data: activeModel, error: activeModelError, isLoading: isLoadingActive } = useGetActiveModel({ 
    query: { 
      queryKey: getGetActiveModelQueryKey(),
      retry: false
    } 
  });
  
  const { data: models, isLoading: isLoadingModels } = useListModels({ query: { queryKey: getListModelsQueryKey() } });
  const { data: supportedModels } = useListSupportedModels({ query: { queryKey: ["supportedModels"] } });
  
  const activateModel = useActivateModel();
  const registerModel = useRegisterModel();

  const handleActivate = (id: number) => {
    activateModel.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActiveModelQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListModelsQueryKey() });
      }
    });
  };

  const handleDownload = (supportedModel: any) => {
    setDownloadingModelId(supportedModel.id);
    
    // Convert to valid provider type
    const providerStr = supportedModel.provider.toLowerCase();
    let provider: AiModelInputProvider = AiModelInputProvider.custom;
    
    if (providerStr.includes('qwen')) provider = AiModelInputProvider.qwen;
    else if (providerStr.includes('gemma')) provider = AiModelInputProvider.gemma;
    else if (providerStr.includes('phi')) provider = AiModelInputProvider.phi;
    else if (providerStr.includes('smollm')) provider = AiModelInputProvider.smollm;
    else if (providerStr.includes('tinyllama')) provider = AiModelInputProvider.tinyllama;

    registerModel.mutate({
      data: {
        name: supportedModel.name,
        provider: provider,
        filename: `${supportedModel.id}.gguf`,
        downloadUrl: supportedModel.downloadUrl,
        sizeBytes: supportedModel.sizeBytes,
        quantization: supportedModel.quantization,
        contextLength: supportedModel.contextLength
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListModelsQueryKey() });
        setDownloadingModelId(null);
      },
      onError: () => {
        setDownloadingModelId(null);
      }
    });
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "Unknown";
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const isWizardMode = activeModelError && (activeModelError as any)?.response?.status === 404;

  if (isLoadingActive || isLoadingModels) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64 bg-card/50" />
        <Skeleton className="h-48 w-full bg-card/50" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full bg-card/50" />
          <Skeleton className="h-48 w-full bg-card/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto font-mono">
      <div className="flex items-center gap-2 mb-6">
        <BrainCircuit className="text-primary" size={24} />
        <h1 className="text-2xl font-bold tracking-tight text-primary">AI ENGINE</h1>
      </div>

      {isWizardMode ? (
        <Card className="bg-primary/5 border-primary/30 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BrainCircuit size={120} />
          </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" /> SYSTEM NOT INITIALIZED
            </CardTitle>
            <CardDescription className="text-base text-foreground/80 pt-2">
              TAIS runs 100% offline. To process your commands, you must download a local AI model.
              Choose a model below based on your device capabilities.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : activeModel ? (
        <Card className="bg-card border-primary/50 shadow-[0_0_20px_rgba(0,255,255,0.05)] mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="text-primary" /> ACTIVE MODEL
              </CardTitle>
              <Badge variant="default" className="animate-pulse shadow-none">ONLINE</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between bg-black/30 p-4 rounded-lg border border-border">
              <div>
                <h3 className="text-2xl font-bold text-foreground">{activeModel.name}</h3>
                <p className="text-muted-foreground uppercase text-sm mt-1">{activeModel.provider} engine</p>
              </div>
              <div className="grid grid-cols-2 md:flex gap-4 md:gap-8">
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Box size={12}/> QUANTIZATION</div>
                  <div className="font-semibold">{activeModel.quantization || 'Q4_K_M'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1"><HardDrive size={12}/> SIZE</div>
                  <div className="font-semibold">{formatBytes(activeModel.sizeBytes || 0)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Cpu size={12}/> CONTEXT</div>
                  <div className="font-semibold">{activeModel.contextLength || 2048} T</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">AVAILABLE MODELS</h2>
        
        {models && models.length > 0 && (
          <div className="grid grid-cols-1 gap-4 mb-8">
            {models.map(model => (
              <Card key={model.id} className={`border ${model.isActive ? 'border-primary shadow-[0_0_10px_rgba(0,255,255,0.1)]' : 'border-border'} bg-card/50`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg">{model.name}</h4>
                      {model.isActive && <Badge variant="outline" className="text-[10px] border-primary text-primary">ACTIVE</Badge>}
                      {model.status === 'downloading' && <Badge variant="warning" className="text-[10px]">DOWNLOADING</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                      <span>{model.quantization}</span>
                      <span>{formatBytes(model.sizeBytes || 0)}</span>
                    </div>
                  </div>
                  
                  {model.status === 'downloading' ? (
                    <div className="w-32 flex flex-col gap-1 items-end">
                      <div className="text-xs text-primary">{model.downloadProgress || 0}%</div>
                      <Progress value={model.downloadProgress || 0} className="h-1.5" />
                    </div>
                  ) : (
                    <Button 
                      variant={model.isActive ? "secondary" : "outline"}
                      disabled={model.isActive || activateModel.isPending}
                      onClick={() => handleActivate(model.id)}
                    >
                      {model.isActive ? 'IN USE' : 'ACTIVATE'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <h2 className="text-lg font-bold text-foreground border-b border-border pb-2 pt-4">SUPPORTED MODELS (DOWNLOAD)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportedModels?.map(sm => (
            <Card key={sm.id} className="bg-card/30 border-border/50 hover:border-border transition-colors">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      {sm.name}
                      {sm.recommended && <Badge variant="success" className="text-[9px] px-1 py-0 h-4">RECOMMENDED</Badge>}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sm.description}</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-muted-foreground/80">
                    <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] border border-white/5">{sm.quantization}</span>
                    <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] border border-white/5">{formatBytes(sm.sizeBytes)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary hover:bg-primary/10 h-8"
                    onClick={() => handleDownload(sm)}
                    disabled={downloadingModelId === sm.id || registerModel.isPending}
                  >
                    {downloadingModelId === sm.id ? (
                      <><Spinner className="mr-2 h-3 w-3" /> INIT...</>
                    ) : (
                      <><Download size={14} className="mr-1.5" /> DOWNLOAD</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
