#!/bin/bash
emcc wasm/sort.cpp -Oz -o src/wasm/sort.js \
    -s EXPORTED_FUNCTIONS="[_sort, _malloc, _free]" \
    -s EXPORTED_RUNTIME_METHODS="[HEAPF32, HEAPU32, HEAPU8]" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORT_NAME=createSortModule \
    -s ENVIRONMENT=worker \
    -s SINGLE_FILE=1 \
    -s WASM_ASYNC_COMPILATION=0

emcc wasm/data.cpp -Oz -o src/wasm/data.js \
    -s EXPORTED_FUNCTIONS="[_pack, _malloc, _free]" \
    -s EXPORTED_RUNTIME_METHODS="[HEAPF32, HEAPU32, HEAPU8]" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s EXPORT_NAME=createDataModule \
    -s ENVIRONMENT=worker \
    -s SINGLE_FILE=1 \
    -s WASM_ASYNC_COMPILATION=0
