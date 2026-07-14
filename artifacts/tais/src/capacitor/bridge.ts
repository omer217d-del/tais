/**
 * TAIS Android Bridge — TypeScript interface layer
 *
 * This module provides a typed interface between the web layer and the
 * native Android Kotlin bridge implemented via Capacitor plugins.
 *
 * The bridge never exposes direct Android API access to the AI or
 * automation engine. All calls are validated by the Kotlin-side
 * AutomationValidator before execution.
 */

import { Capacitor } from "@capacitor/core";

// ─── Type Definitions ──────────────────────────────────────────────────────

export type TriggerType =
  | "battery"
  | "charging"
  | "time"
  | "date"
  | "location"
  | "bluetooth"
  | "wifi"
  | "headset"
  | "motion"
  | "shake"
  | "flip"
  | "app_open"
  | "app_close"
  | "notification"
  | "nfc";

export type ActionType =
  | "notification"
  | "speak"
  | "vibrate"
  | "flashlight"
  | "open_app"
  | "close_app"
  | "volume"
  | "brightness"
  | "wifi"
  | "bluetooth"
  | "clipboard"
  | "launch_intent"
  | "http_request"
  | "file_operation";

export interface TriggerConfig {
  type: TriggerType;
  parameters: Record<string, unknown>;
}

export interface ActionConfig {
  type: ActionType;
  parameters: Record<string, unknown>;
}

export interface BridgeResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export interface ModelLoadResult {
  success: boolean;
  modelPath: string;
  contextLength: number;
  error?: string;
}

export interface InferenceResult {
  success: boolean;
  text: string;
  tokensGenerated: number;
  timeMs: number;
  error?: string;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  manufacturer: string;
  model: string;
  freeMemoryMb: number;
  totalMemoryMb: number;
  batteryLevel: number;
  isCharging: boolean;
}

// ─── Platform Detection ────────────────────────────────────────────────────

export const isNativePlatform = (): boolean =>
  Capacitor.isNativePlatform();

export const isAndroid = (): boolean =>
  Capacitor.getPlatform() === "android";

// ─── Bridge Proxy ─────────────────────────────────────────────────────────

/**
 * Safe bridge proxy — falls back to mock responses on web.
 * On Android, delegates to the Kotlin TAIS Bridge plugin.
 */
async function callBridge<T = BridgeResult>(
  method: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  if (!isNativePlatform()) {
    return mockBridgeCall<T>(method, args);
  }

  const { Plugins } = await import("@capacitor/core");
  const plugin = (Plugins as Record<string, unknown>)["TaisBridge"] as Record<
    string,
    (args: unknown) => Promise<T>
  >;

  if (!plugin || typeof plugin[method] !== "function") {
    throw new Error(`Bridge method not found: ${method}`);
  }

  return plugin[method](args);
}

// ─── Mock Bridge (Web fallback) ────────────────────────────────────────────

function mockBridgeCall<T>(
  method: string,
  _args: Record<string, unknown>
): Promise<T> {
  const mocks: Record<string, unknown> = {
    getDeviceInfo: {
      platform: "web",
      osVersion: "browser",
      manufacturer: "browser",
      model: "browser",
      freeMemoryMb: 2048,
      totalMemoryMb: 4096,
      batteryLevel: 85,
      isCharging: false,
    } satisfies DeviceInfo,
    checkPermission: { granted: true, androidPermission: "mock" },
    requestPermission: { granted: true, androidPermission: "mock" },
    executeAction: { success: true },
    loadModel: { success: true, modelPath: "/mock/model.gguf", contextLength: 2048 },
    runInference: {
      success: true,
      text: "Mock inference response from web fallback.",
      tokensGenerated: 10,
      timeMs: 50,
    },
    registerTrigger: { success: true },
    unregisterTrigger: { success: true },
    listInstalledApps: { apps: [] },
    getStorageInfo: { availableMb: 10240, totalMb: 32768 },
  };

  return Promise.resolve((mocks[method] ?? { success: true }) as T);
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Get device hardware and system information. */
export const getDeviceInfo = (): Promise<DeviceInfo> =>
  callBridge<DeviceInfo>("getDeviceInfo");

/** Check whether an Android permission is granted. */
export const checkPermission = (androidPermission: string): Promise<{ granted: boolean }> =>
  callBridge("checkPermission", { androidPermission });

/** Request an Android permission from the user. */
export const requestPermission = (androidPermission: string): Promise<{ granted: boolean }> =>
  callBridge("requestPermission", { androidPermission });

/** Execute a validated automation action via the Kotlin bridge. */
export const executeAction = (action: ActionConfig): Promise<BridgeResult> =>
  callBridge("executeAction", { type: action.type, parameters: action.parameters });

/** Load a GGUF model into llama.cpp via the Kotlin AI manager. */
export const loadModel = (modelPath: string, contextLength: number): Promise<ModelLoadResult> =>
  callBridge("loadModel", { modelPath, contextLength });

/** Run inference on the loaded model. */
export const runInference = (
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<InferenceResult> =>
  callBridge("runInference", { prompt, maxTokens, temperature });

/** Register a trigger listener in the Kotlin engine. */
export const registerTrigger = (trigger: TriggerConfig, automationId: number): Promise<BridgeResult> =>
  callBridge("registerTrigger", { type: trigger.type, parameters: trigger.parameters, automationId });

/** Unregister a trigger listener. */
export const unregisterTrigger = (automationId: number): Promise<BridgeResult> =>
  callBridge("unregisterTrigger", { automationId });

/** Get available storage information. */
export const getStorageInfo = (): Promise<{ availableMb: number; totalMb: number }> =>
  callBridge("getStorageInfo");

/** List installed apps (for app_open/close triggers). */
export const listInstalledApps = (): Promise<{ apps: Array<{ packageName: string; name: string }> }> =>
  callBridge("listInstalledApps");
