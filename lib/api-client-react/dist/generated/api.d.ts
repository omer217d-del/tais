import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AiModel, AiModelInput, AppPermission, AppSettings, AppSettingsUpdate, Automation, AutomationInput, AutomationStats, AutomationUpdate, ChatMessage, ChatMessageInput, ChatResponse, ErrorResponse, HealthStatus, ListAutomationsParams, ListChatMessagesParams, ListLogsParams, LogListResponse, LogStats, PermissionUpdate, Plugin, PluginInput, SupportedModel } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAutomationsUrl: (params?: ListAutomationsParams) => string;
/**
 * @summary List all automations
 */
export declare const listAutomations: (params?: ListAutomationsParams, options?: RequestInit) => Promise<Automation[]>;
export declare const getListAutomationsQueryKey: (params?: ListAutomationsParams) => readonly ["/api/automations", ...ListAutomationsParams[]];
export declare const getListAutomationsQueryOptions: <TData = Awaited<ReturnType<typeof listAutomations>>, TError = ErrorType<unknown>>(params?: ListAutomationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAutomations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAutomations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAutomationsQueryResult = NonNullable<Awaited<ReturnType<typeof listAutomations>>>;
export type ListAutomationsQueryError = ErrorType<unknown>;
/**
 * @summary List all automations
 */
export declare function useListAutomations<TData = Awaited<ReturnType<typeof listAutomations>>, TError = ErrorType<unknown>>(params?: ListAutomationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAutomations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateAutomationUrl: () => string;
/**
 * @summary Create a new automation
 */
export declare const createAutomation: (automationInput: AutomationInput, options?: RequestInit) => Promise<Automation>;
export declare const getCreateAutomationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAutomation>>, TError, {
        data: BodyType<AutomationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAutomation>>, TError, {
    data: BodyType<AutomationInput>;
}, TContext>;
export type CreateAutomationMutationResult = NonNullable<Awaited<ReturnType<typeof createAutomation>>>;
export type CreateAutomationMutationBody = BodyType<AutomationInput>;
export type CreateAutomationMutationError = ErrorType<unknown>;
/**
* @summary Create a new automation
*/
export declare const useCreateAutomation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAutomation>>, TError, {
        data: BodyType<AutomationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAutomation>>, TError, {
    data: BodyType<AutomationInput>;
}, TContext>;
export declare const getGetAutomationStatsUrl: () => string;
/**
 * @summary Get automation dashboard stats
 */
export declare const getAutomationStats: (options?: RequestInit) => Promise<AutomationStats>;
export declare const getGetAutomationStatsQueryKey: () => readonly ["/api/automations/stats"];
export declare const getGetAutomationStatsQueryOptions: <TData = Awaited<ReturnType<typeof getAutomationStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAutomationStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAutomationStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAutomationStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getAutomationStats>>>;
export type GetAutomationStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get automation dashboard stats
 */
export declare function useGetAutomationStats<TData = Awaited<ReturnType<typeof getAutomationStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAutomationStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAutomationUrl: (id: number) => string;
/**
 * @summary Get automation by ID
 */
export declare const getAutomation: (id: number, options?: RequestInit) => Promise<Automation>;
export declare const getGetAutomationQueryKey: (id: number) => readonly [`/api/automations/${number}`];
export declare const getGetAutomationQueryOptions: <TData = Awaited<ReturnType<typeof getAutomation>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAutomation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAutomation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAutomationQueryResult = NonNullable<Awaited<ReturnType<typeof getAutomation>>>;
export type GetAutomationQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get automation by ID
 */
export declare function useGetAutomation<TData = Awaited<ReturnType<typeof getAutomation>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAutomation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateAutomationUrl: (id: number) => string;
/**
 * @summary Update an automation
 */
export declare const updateAutomation: (id: number, automationUpdate: AutomationUpdate, options?: RequestInit) => Promise<Automation>;
export declare const getUpdateAutomationMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAutomation>>, TError, {
        id: number;
        data: BodyType<AutomationUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAutomation>>, TError, {
    id: number;
    data: BodyType<AutomationUpdate>;
}, TContext>;
export type UpdateAutomationMutationResult = NonNullable<Awaited<ReturnType<typeof updateAutomation>>>;
export type UpdateAutomationMutationBody = BodyType<AutomationUpdate>;
export type UpdateAutomationMutationError = ErrorType<ErrorResponse>;
/**
* @summary Update an automation
*/
export declare const useUpdateAutomation: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAutomation>>, TError, {
        id: number;
        data: BodyType<AutomationUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAutomation>>, TError, {
    id: number;
    data: BodyType<AutomationUpdate>;
}, TContext>;
export declare const getDeleteAutomationUrl: (id: number) => string;
/**
 * @summary Delete an automation
 */
export declare const deleteAutomation: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteAutomationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAutomation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAutomation>>, TError, {
    id: number;
}, TContext>;
export type DeleteAutomationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAutomation>>>;
export type DeleteAutomationMutationError = ErrorType<unknown>;
/**
* @summary Delete an automation
*/
export declare const useDeleteAutomation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAutomation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAutomation>>, TError, {
    id: number;
}, TContext>;
export declare const getToggleAutomationUrl: (id: number) => string;
/**
 * @summary Toggle automation enabled/disabled
 */
export declare const toggleAutomation: (id: number, options?: RequestInit) => Promise<Automation>;
export declare const getToggleAutomationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof toggleAutomation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof toggleAutomation>>, TError, {
    id: number;
}, TContext>;
export type ToggleAutomationMutationResult = NonNullable<Awaited<ReturnType<typeof toggleAutomation>>>;
export type ToggleAutomationMutationError = ErrorType<unknown>;
/**
* @summary Toggle automation enabled/disabled
*/
export declare const useToggleAutomation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof toggleAutomation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof toggleAutomation>>, TError, {
    id: number;
}, TContext>;
export declare const getListPluginsUrl: () => string;
/**
 * @summary List all plugins
 */
export declare const listPlugins: (options?: RequestInit) => Promise<Plugin[]>;
export declare const getListPluginsQueryKey: () => readonly ["/api/plugins"];
export declare const getListPluginsQueryOptions: <TData = Awaited<ReturnType<typeof listPlugins>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPlugins>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPlugins>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPluginsQueryResult = NonNullable<Awaited<ReturnType<typeof listPlugins>>>;
export type ListPluginsQueryError = ErrorType<unknown>;
/**
 * @summary List all plugins
 */
export declare function useListPlugins<TData = Awaited<ReturnType<typeof listPlugins>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPlugins>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getInstallPluginUrl: () => string;
/**
 * @summary Install a plugin
 */
export declare const installPlugin: (pluginInput: PluginInput, options?: RequestInit) => Promise<Plugin>;
export declare const getInstallPluginMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof installPlugin>>, TError, {
        data: BodyType<PluginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof installPlugin>>, TError, {
    data: BodyType<PluginInput>;
}, TContext>;
export type InstallPluginMutationResult = NonNullable<Awaited<ReturnType<typeof installPlugin>>>;
export type InstallPluginMutationBody = BodyType<PluginInput>;
export type InstallPluginMutationError = ErrorType<unknown>;
/**
* @summary Install a plugin
*/
export declare const useInstallPlugin: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof installPlugin>>, TError, {
        data: BodyType<PluginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof installPlugin>>, TError, {
    data: BodyType<PluginInput>;
}, TContext>;
export declare const getGetPluginUrl: (id: number) => string;
/**
 * @summary Get plugin by ID
 */
export declare const getPlugin: (id: number, options?: RequestInit) => Promise<Plugin>;
export declare const getGetPluginQueryKey: (id: number) => readonly [`/api/plugins/${number}`];
export declare const getGetPluginQueryOptions: <TData = Awaited<ReturnType<typeof getPlugin>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlugin>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPlugin>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPluginQueryResult = NonNullable<Awaited<ReturnType<typeof getPlugin>>>;
export type GetPluginQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get plugin by ID
 */
export declare function useGetPlugin<TData = Awaited<ReturnType<typeof getPlugin>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlugin>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeletePluginUrl: (id: number) => string;
/**
 * @summary Delete a plugin
 */
export declare const deletePlugin: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePluginMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePlugin>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePlugin>>, TError, {
    id: number;
}, TContext>;
export type DeletePluginMutationResult = NonNullable<Awaited<ReturnType<typeof deletePlugin>>>;
export type DeletePluginMutationError = ErrorType<unknown>;
/**
* @summary Delete a plugin
*/
export declare const useDeletePlugin: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePlugin>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePlugin>>, TError, {
    id: number;
}, TContext>;
export declare const getTogglePluginUrl: (id: number) => string;
/**
 * @summary Toggle plugin enabled/disabled
 */
export declare const togglePlugin: (id: number, options?: RequestInit) => Promise<Plugin>;
export declare const getTogglePluginMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof togglePlugin>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof togglePlugin>>, TError, {
    id: number;
}, TContext>;
export type TogglePluginMutationResult = NonNullable<Awaited<ReturnType<typeof togglePlugin>>>;
export type TogglePluginMutationError = ErrorType<unknown>;
/**
* @summary Toggle plugin enabled/disabled
*/
export declare const useTogglePlugin: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof togglePlugin>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof togglePlugin>>, TError, {
    id: number;
}, TContext>;
export declare const getListModelsUrl: () => string;
/**
 * @summary List all registered models
 */
export declare const listModels: (options?: RequestInit) => Promise<AiModel[]>;
export declare const getListModelsQueryKey: () => readonly ["/api/models"];
export declare const getListModelsQueryOptions: <TData = Awaited<ReturnType<typeof listModels>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listModels>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listModels>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListModelsQueryResult = NonNullable<Awaited<ReturnType<typeof listModels>>>;
export type ListModelsQueryError = ErrorType<unknown>;
/**
 * @summary List all registered models
 */
export declare function useListModels<TData = Awaited<ReturnType<typeof listModels>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listModels>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRegisterModelUrl: () => string;
/**
 * @summary Register a new AI model
 */
export declare const registerModel: (aiModelInput: AiModelInput, options?: RequestInit) => Promise<AiModel>;
export declare const getRegisterModelMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof registerModel>>, TError, {
        data: BodyType<AiModelInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof registerModel>>, TError, {
    data: BodyType<AiModelInput>;
}, TContext>;
export type RegisterModelMutationResult = NonNullable<Awaited<ReturnType<typeof registerModel>>>;
export type RegisterModelMutationBody = BodyType<AiModelInput>;
export type RegisterModelMutationError = ErrorType<unknown>;
/**
* @summary Register a new AI model
*/
export declare const useRegisterModel: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof registerModel>>, TError, {
        data: BodyType<AiModelInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof registerModel>>, TError, {
    data: BodyType<AiModelInput>;
}, TContext>;
export declare const getGetActiveModelUrl: () => string;
/**
 * @summary Get the currently active model
 */
export declare const getActiveModel: (options?: RequestInit) => Promise<AiModel>;
export declare const getGetActiveModelQueryKey: () => readonly ["/api/models/active"];
export declare const getGetActiveModelQueryOptions: <TData = Awaited<ReturnType<typeof getActiveModel>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getActiveModel>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getActiveModel>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetActiveModelQueryResult = NonNullable<Awaited<ReturnType<typeof getActiveModel>>>;
export type GetActiveModelQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get the currently active model
 */
export declare function useGetActiveModel<TData = Awaited<ReturnType<typeof getActiveModel>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getActiveModel>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListSupportedModelsUrl: () => string;
/**
 * @summary List supported GGUF models available for download
 */
export declare const listSupportedModels: (options?: RequestInit) => Promise<SupportedModel[]>;
export declare const getListSupportedModelsQueryKey: () => readonly ["/api/models/supported"];
export declare const getListSupportedModelsQueryOptions: <TData = Awaited<ReturnType<typeof listSupportedModels>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSupportedModels>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSupportedModels>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSupportedModelsQueryResult = NonNullable<Awaited<ReturnType<typeof listSupportedModels>>>;
export type ListSupportedModelsQueryError = ErrorType<unknown>;
/**
 * @summary List supported GGUF models available for download
 */
export declare function useListSupportedModels<TData = Awaited<ReturnType<typeof listSupportedModels>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSupportedModels>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetModelUrl: (id: number) => string;
/**
 * @summary Get model by ID
 */
export declare const getModel: (id: number, options?: RequestInit) => Promise<AiModel>;
export declare const getGetModelQueryKey: (id: number) => readonly [`/api/models/${number}`];
export declare const getGetModelQueryOptions: <TData = Awaited<ReturnType<typeof getModel>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getModel>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getModel>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetModelQueryResult = NonNullable<Awaited<ReturnType<typeof getModel>>>;
export type GetModelQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get model by ID
 */
export declare function useGetModel<TData = Awaited<ReturnType<typeof getModel>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getModel>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteModelUrl: (id: number) => string;
/**
 * @summary Delete a model record
 */
export declare const deleteModel: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteModelMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteModel>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteModel>>, TError, {
    id: number;
}, TContext>;
export type DeleteModelMutationResult = NonNullable<Awaited<ReturnType<typeof deleteModel>>>;
export type DeleteModelMutationError = ErrorType<unknown>;
/**
* @summary Delete a model record
*/
export declare const useDeleteModel: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteModel>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteModel>>, TError, {
    id: number;
}, TContext>;
export declare const getActivateModelUrl: (id: number) => string;
/**
 * @summary Set model as active
 */
export declare const activateModel: (id: number, options?: RequestInit) => Promise<AiModel>;
export declare const getActivateModelMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof activateModel>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof activateModel>>, TError, {
    id: number;
}, TContext>;
export type ActivateModelMutationResult = NonNullable<Awaited<ReturnType<typeof activateModel>>>;
export type ActivateModelMutationError = ErrorType<unknown>;
/**
* @summary Set model as active
*/
export declare const useActivateModel: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof activateModel>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof activateModel>>, TError, {
    id: number;
}, TContext>;
export declare const getListLogsUrl: (params?: ListLogsParams) => string;
/**
 * @summary List system logs
 */
export declare const listLogs: (params?: ListLogsParams, options?: RequestInit) => Promise<LogListResponse>;
export declare const getListLogsQueryKey: (params?: ListLogsParams) => readonly ["/api/logs", ...ListLogsParams[]];
export declare const getListLogsQueryOptions: <TData = Awaited<ReturnType<typeof listLogs>>, TError = ErrorType<unknown>>(params?: ListLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLogsQueryResult = NonNullable<Awaited<ReturnType<typeof listLogs>>>;
export type ListLogsQueryError = ErrorType<unknown>;
/**
 * @summary List system logs
 */
export declare function useListLogs<TData = Awaited<ReturnType<typeof listLogs>>, TError = ErrorType<unknown>>(params?: ListLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getClearLogsUrl: () => string;
/**
 * @summary Clear all logs
 */
export declare const clearLogs: (options?: RequestInit) => Promise<void>;
export declare const getClearLogsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof clearLogs>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof clearLogs>>, TError, void, TContext>;
export type ClearLogsMutationResult = NonNullable<Awaited<ReturnType<typeof clearLogs>>>;
export type ClearLogsMutationError = ErrorType<unknown>;
/**
* @summary Clear all logs
*/
export declare const useClearLogs: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof clearLogs>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof clearLogs>>, TError, void, TContext>;
export declare const getGetLogStatsUrl: () => string;
/**
 * @summary Get log statistics
 */
export declare const getLogStats: (options?: RequestInit) => Promise<LogStats>;
export declare const getGetLogStatsQueryKey: () => readonly ["/api/logs/stats"];
export declare const getGetLogStatsQueryOptions: <TData = Awaited<ReturnType<typeof getLogStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLogStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLogStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLogStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getLogStats>>>;
export type GetLogStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get log statistics
 */
export declare function useGetLogStats<TData = Awaited<ReturnType<typeof getLogStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLogStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListPermissionsUrl: () => string;
/**
 * @summary List all Android permissions and their status
 */
export declare const listPermissions: (options?: RequestInit) => Promise<AppPermission[]>;
export declare const getListPermissionsQueryKey: () => readonly ["/api/permissions"];
export declare const getListPermissionsQueryOptions: <TData = Awaited<ReturnType<typeof listPermissions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPermissions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPermissions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPermissionsQueryResult = NonNullable<Awaited<ReturnType<typeof listPermissions>>>;
export type ListPermissionsQueryError = ErrorType<unknown>;
/**
 * @summary List all Android permissions and their status
 */
export declare function useListPermissions<TData = Awaited<ReturnType<typeof listPermissions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPermissions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdatePermissionUrl: (id: number) => string;
/**
 * @summary Update permission grant status
 */
export declare const updatePermission: (id: number, permissionUpdate: PermissionUpdate, options?: RequestInit) => Promise<AppPermission>;
export declare const getUpdatePermissionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePermission>>, TError, {
        id: number;
        data: BodyType<PermissionUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePermission>>, TError, {
    id: number;
    data: BodyType<PermissionUpdate>;
}, TContext>;
export type UpdatePermissionMutationResult = NonNullable<Awaited<ReturnType<typeof updatePermission>>>;
export type UpdatePermissionMutationBody = BodyType<PermissionUpdate>;
export type UpdatePermissionMutationError = ErrorType<unknown>;
/**
* @summary Update permission grant status
*/
export declare const useUpdatePermission: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePermission>>, TError, {
        id: number;
        data: BodyType<PermissionUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePermission>>, TError, {
    id: number;
    data: BodyType<PermissionUpdate>;
}, TContext>;
export declare const getGetSettingsUrl: () => string;
/**
 * @summary Get app settings
 */
export declare const getSettings: (options?: RequestInit) => Promise<AppSettings>;
export declare const getGetSettingsQueryKey: () => readonly ["/api/settings"];
export declare const getGetSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>;
export type GetSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get app settings
 */
export declare function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateSettingsUrl: () => string;
/**
 * @summary Update app settings
 */
export declare const updateSettings: (appSettingsUpdate: AppSettingsUpdate, options?: RequestInit) => Promise<AppSettings>;
export declare const getUpdateSettingsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<AppSettingsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<AppSettingsUpdate>;
}, TContext>;
export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>;
export type UpdateSettingsMutationBody = BodyType<AppSettingsUpdate>;
export type UpdateSettingsMutationError = ErrorType<unknown>;
/**
* @summary Update app settings
*/
export declare const useUpdateSettings: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError, {
        data: BodyType<AppSettingsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSettings>>, TError, {
    data: BodyType<AppSettingsUpdate>;
}, TContext>;
export declare const getListChatMessagesUrl: (params?: ListChatMessagesParams) => string;
/**
 * @summary Get chat history
 */
export declare const listChatMessages: (params?: ListChatMessagesParams, options?: RequestInit) => Promise<ChatMessage[]>;
export declare const getListChatMessagesQueryKey: (params?: ListChatMessagesParams) => readonly ["/api/chat/messages", ...ListChatMessagesParams[]];
export declare const getListChatMessagesQueryOptions: <TData = Awaited<ReturnType<typeof listChatMessages>>, TError = ErrorType<unknown>>(params?: ListChatMessagesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listChatMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listChatMessages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListChatMessagesQueryResult = NonNullable<Awaited<ReturnType<typeof listChatMessages>>>;
export type ListChatMessagesQueryError = ErrorType<unknown>;
/**
 * @summary Get chat history
 */
export declare function useListChatMessages<TData = Awaited<ReturnType<typeof listChatMessages>>, TError = ErrorType<unknown>>(params?: ListChatMessagesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listChatMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendChatMessageUrl: () => string;
/**
 * @summary Send a message to TAIS AI
 */
export declare const sendChatMessage: (chatMessageInput: ChatMessageInput, options?: RequestInit) => Promise<ChatResponse>;
export declare const getSendChatMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
        data: BodyType<ChatMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
    data: BodyType<ChatMessageInput>;
}, TContext>;
export type SendChatMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendChatMessage>>>;
export type SendChatMessageMutationBody = BodyType<ChatMessageInput>;
export type SendChatMessageMutationError = ErrorType<unknown>;
/**
* @summary Send a message to TAIS AI
*/
export declare const useSendChatMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
        data: BodyType<ChatMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendChatMessage>>, TError, {
    data: BodyType<ChatMessageInput>;
}, TContext>;
export declare const getClearChatHistoryUrl: () => string;
/**
 * @summary Clear all chat messages
 */
export declare const clearChatHistory: (options?: RequestInit) => Promise<void>;
export declare const getClearChatHistoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof clearChatHistory>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof clearChatHistory>>, TError, void, TContext>;
export type ClearChatHistoryMutationResult = NonNullable<Awaited<ReturnType<typeof clearChatHistory>>>;
export type ClearChatHistoryMutationError = ErrorType<unknown>;
/**
* @summary Clear all chat messages
*/
export declare const useClearChatHistory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof clearChatHistory>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof clearChatHistory>>, TError, void, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map