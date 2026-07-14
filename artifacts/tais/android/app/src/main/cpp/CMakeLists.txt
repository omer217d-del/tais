cmake_minimum_required(VERSION 3.22.1)
project("tais")

# ─── llama.cpp Integration ──────────────────────────────────────────────────
#
# To enable REAL llama.cpp inference:
#
# 1. Add llama.cpp as a git submodule at the workspace root:
#    git submodule add https://github.com/ggerganov/llama.cpp.git llama.cpp
#    git submodule update --init --recursive
#
# 2. Uncomment the LLAMA_SOURCE_DIR and add_subdirectory lines below.
#
# 3. In target_link_libraries, uncomment "llama" (the llama.cpp library target).
#
# 4. In llama_jni.cpp, uncomment the #include "llama.h" and full implementation.
#
# The stub JNI currently returns a pre-formatted JSON response for CI/testing.
# When the submodule is present, real GGUF inference runs on-device.

# set(LLAMA_SOURCE_DIR ${CMAKE_SOURCE_DIR}/../../../../../../../llama.cpp)

# if(EXISTS "${LLAMA_SOURCE_DIR}/CMakeLists.txt")
#   set(LLAMA_BUILD_TESTS OFF CACHE BOOL "" FORCE)
#   set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
#   set(LLAMA_BUILD_SERVER OFF CACHE BOOL "" FORCE)
#   set(LLAMA_CURL OFF CACHE BOOL "" FORCE)
#   # Android-specific optimizations
#   if(ANDROID_ABI STREQUAL "arm64-v8a")
#     set(LLAMA_NATIVE OFF CACHE BOOL "" FORCE)
#     set(GGML_OPENMP OFF CACHE BOOL "" FORCE)
#     set(GGML_METAL OFF CACHE BOOL "" FORCE)
#   endif()
#   add_subdirectory(${LLAMA_SOURCE_DIR} ${CMAKE_BINARY_DIR}/llama.cpp)
#   set(LLAMA_AVAILABLE TRUE)
# else()
#   message(WARNING "llama.cpp submodule not found — building stub JNI only")
#   set(LLAMA_AVAILABLE FALSE)
# endif()

# ─── TAIS JNI Bridge ────────────────────────────────────────────────────────

add_library(
    llama
    SHARED
    llama_jni.cpp
)

find_library(log-lib log)

target_link_libraries(
    llama
    ${log-lib}
    # Uncomment when llama.cpp submodule is added:
    # $<$<BOOL:${LLAMA_AVAILABLE}>:llama_static>
    # $<$<BOOL:${LLAMA_AVAILABLE}>:common>
)

target_compile_options(llama PRIVATE
    -O3
    -std=c++17
    -fvisibility=hidden
    -ffunction-sections
    -fdata-sections
    # Uncomment for llama.cpp:
    # $<$<BOOL:${LLAMA_AVAILABLE}>:-DLLAMA_AVAILABLE>
)

target_link_options(llama PRIVATE
    -Wl,--gc-sections
)
