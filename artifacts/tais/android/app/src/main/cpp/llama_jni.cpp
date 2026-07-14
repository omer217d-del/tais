/**
 * llama_jni.cpp — JNI bridge between Kotlin LlamaManager and llama.cpp
 *
 * This file implements the native methods declared in LlamaManager.kt.
 *
 * ─── How to enable full llama.cpp inference ─────────────────────────────────
 *
 *  1. Add llama.cpp as a git submodule at the workspace root:
 *       git submodule add https://github.com/ggerganov/llama.cpp.git llama.cpp
 *       git submodule update --init --recursive
 *
 *  2. In CMakeLists.txt, uncomment the add_subdirectory block.
 *
 *  3. Re-build: the LLAMA_AVAILABLE macro will be defined and the real
 *     inference path below will be compiled in automatically.
 *
 * ─── Current state ──────────────────────────────────────────────────────────
 *
 *  When LLAMA_AVAILABLE is defined (submodule present), this file uses the
 *  real llama.cpp C API for on-device GGUF inference.
 *
 *  When LLAMA_AVAILABLE is NOT defined (CI, emulator, first clone), the stub
 *  path returns a valid JSON Automation Plan so the UI compiles and runs.
 */

#include <jni.h>
#include <string>
#include <vector>
#include <android/log.h>

#define LOG_TAG "LlamaJNI"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,  LOG_TAG, __VA_ARGS__)
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN,  LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// ─── Real llama.cpp path (activated when submodule is present) ───────────────

#ifdef LLAMA_AVAILABLE
#include "llama.h"
#include "common.h"

struct LlamaContext {
    llama_model   *model   = nullptr;
    llama_context *ctx     = nullptr;
    int            n_ctx   = 2048;
    int            n_threads = 4;
};

static std::string run_inference_impl(
        LlamaContext *lctx,
        const std::string &prompt,
        int max_tokens,
        float temperature,
        float top_p,
        float repeat_penalty)
{
    llama_context *ctx   = lctx->ctx;
    llama_model   *model = lctx->model;

    // Tokenize prompt
    std::vector<llama_token> tokens_list;
    tokens_list.resize(prompt.size() + 64);
    int n_tokens = llama_tokenize(
            model,
            prompt.c_str(), (int)prompt.size(),
            tokens_list.data(), (int)tokens_list.size(),
            /* add_special */ true,
            /* parse_special */ false);

    if (n_tokens < 0) {
        LOGE("Tokenization failed (needed %d tokens)", -n_tokens);
        return "";
    }
    tokens_list.resize(n_tokens);

    // Reset KV cache
    llama_kv_cache_clear(ctx);

    // Evaluate prompt tokens in a batch
    llama_batch batch = llama_batch_init(512, 0, 1);

    for (int i = 0; i < n_tokens; ++i) {
        llama_batch_add(batch, tokens_list[i], i, {0}, false);
    }
    batch.logits[batch.n_tokens - 1] = true; // request logits for last token

    if (llama_decode(ctx, batch) != 0) {
        LOGE("llama_decode (prompt) failed");
        llama_batch_free(batch);
        return "";
    }

    // Sampling context
    llama_sampler *sampler = llama_sampler_chain_init(llama_sampler_chain_default_params());
    llama_sampler_chain_add(sampler, llama_sampler_init_temp(temperature));
    llama_sampler_chain_add(sampler, llama_sampler_init_top_p(top_p, 1));
    llama_sampler_chain_add(sampler, llama_sampler_init_penalties(
            llama_n_ctx(ctx), /* last_n */ 64,
            repeat_penalty, /* alpha_freq */ 0.0f, /* alpha_pres */ 0.0f));
    llama_sampler_chain_add(sampler, llama_sampler_init_greedy());

    // Generate tokens
    std::string result;
    int n_cur = n_tokens;

    for (int i = 0; i < max_tokens; ++i) {
        llama_token new_token = llama_sampler_sample(sampler, ctx, -1);

        if (llama_token_is_eog(model, new_token)) break;

        // Detokenize
        char buf[128];
        int n = llama_token_to_piece(model, new_token, buf, sizeof(buf), 0, false);
        if (n > 0) result.append(buf, n);

        // Prepare next batch
        llama_batch_clear(batch);
        llama_batch_add(batch, new_token, n_cur, {0}, true);
        n_cur++;

        if (llama_decode(ctx, batch) != 0) {
            LOGE("llama_decode (generation) failed at token %d", i);
            break;
        }
    }

    llama_sampler_free(sampler);
    llama_batch_free(batch);
    return result;
}

#endif // LLAMA_AVAILABLE

// ─── Stub path (fallback JSON for CI / emulator) ─────────────────────────────

static std::string make_stub_response() {
    return
        "{\"intent\":\"automation\","
        "\"trigger\":{\"type\":\"battery\",\"parameters\":{\"level\":20,\"comparison\":\"lte\"}},"
        "\"action\":{\"type\":\"notification\",\"parameters\":{\"title\":\"TAIS\",\"message\":\"Batarya d\\u00fc\\u015f\\u00fck!\"}},"
        "\"name\":\"Batarya Uyard\\u0131s\\u0131\","
        "\"confidence\":0.95}";
}

// ─── JNI exports ─────────────────────────────────────────────────────────────

extern "C" {

/**
 * Load a GGUF model file.  Returns a native context pointer (non-zero) on
 * success, or 0 on failure.
 */
JNIEXPORT jlong JNICALL
Java_com_tais_app_ai_LlamaManager_nativeLoadModel(
        JNIEnv *env,
        jobject /* thiz */,
        jstring modelPathStr,
        jint    contextLength,
        jint    nThreads)
{
    const char *modelPath = env->GetStringUTFChars(modelPathStr, nullptr);
    LOGI("nativeLoadModel: path=%s ctx=%d threads=%d", modelPath, contextLength, nThreads);

#ifdef LLAMA_AVAILABLE
    llama_backend_init();

    llama_model_params model_params = llama_model_default_params();
    model_params.n_gpu_layers = 0; // CPU-only on Android; set > 0 for Vulkan/OpenCL

    llama_model *model = llama_load_model_from_file(modelPath, model_params);
    env->ReleaseStringUTFChars(modelPathStr, modelPath);

    if (!model) {
        LOGE("Failed to load model from file");
        return 0L;
    }

    llama_context_params ctx_params = llama_context_default_params();
    ctx_params.n_ctx     = (uint32_t)contextLength;
    ctx_params.n_threads = (uint32_t)nThreads;
    ctx_params.n_threads_batch = (uint32_t)nThreads;

    llama_context *ctx = llama_new_context_with_model(model, ctx_params);
    if (!ctx) {
        LOGE("Failed to create llama context");
        llama_free_model(model);
        return 0L;
    }

    auto *lctx      = new LlamaContext();
    lctx->model     = model;
    lctx->ctx       = ctx;
    lctx->n_ctx     = contextLength;
    lctx->n_threads = nThreads;

    LOGI("Model loaded — vocab_size=%d n_ctx=%d",
         llama_n_vocab(model), llama_n_ctx(ctx));
    return reinterpret_cast<jlong>(lctx);

#else
    env->ReleaseStringUTFChars(modelPathStr, modelPath);
    LOGW("llama.cpp not available — returning stub context (add the submodule to enable real inference)");
    // Return a non-zero sentinel so the Kotlin layer treats load as successful
    return 1L;
#endif
}

/**
 * Run inference on a loaded context.
 * Returns the generated text string (may be JSON Automation Plan or free text).
 */
JNIEXPORT jstring JNICALL
Java_com_tais_app_ai_LlamaManager_nativeRunInference(
        JNIEnv *env,
        jobject /* thiz */,
        jlong   contextPtr,
        jstring promptStr,
        jint    maxTokens,
        jfloat  temperature,
        jfloat  topP,
        jfloat  repeatPenalty)
{
    const char *prompt = env->GetStringUTFChars(promptStr, nullptr);
    LOGI("nativeRunInference: maxTokens=%d temp=%.2f", maxTokens, temperature);

#ifdef LLAMA_AVAILABLE
    auto *lctx = reinterpret_cast<LlamaContext *>(contextPtr);
    std::string result;

    if (!lctx || !lctx->ctx) {
        LOGE("Invalid context pointer");
        env->ReleaseStringUTFChars(promptStr, prompt);
        return env->NewStringUTF(make_stub_response().c_str());
    }

    result = run_inference_impl(lctx, std::string(prompt), maxTokens,
                                temperature, topP, repeatPenalty);
    env->ReleaseStringUTFChars(promptStr, prompt);
    LOGI("Inference complete: %zu chars generated", result.size());
    return env->NewStringUTF(result.c_str());

#else
    env->ReleaseStringUTFChars(promptStr, prompt);
    std::string stub = make_stub_response();
    return env->NewStringUTF(stub.c_str());
#endif
}

/**
 * Free all native resources associated with the context pointer.
 */
JNIEXPORT void JNICALL
Java_com_tais_app_ai_LlamaManager_nativeFreeContext(
        JNIEnv *env,
        jobject /* thiz */,
        jlong   contextPtr)
{
    if (contextPtr == 0L || contextPtr == 1L) return; // stub sentinel

#ifdef LLAMA_AVAILABLE
    auto *lctx = reinterpret_cast<LlamaContext *>(contextPtr);
    if (lctx) {
        if (lctx->ctx)   llama_free(lctx->ctx);
        if (lctx->model) llama_free_model(lctx->model);
        delete lctx;
    }
    llama_backend_free();
    LOGI("Context freed and backend shut down");
#else
    LOGI("nativeFreeContext: stub path — nothing to free");
#endif
}

} // extern "C"
