#!/bin/bash
emcc --bind wasm/sort.cpp -Oz -o src/wasm/sort.js \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=loadWasm \
    -s EXPORTED_FUNCTIONS="[_sort, _malloc, _free]" \
    -s SINGLE_FILE=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT=worker

emcc --bind wasm/data.cpp -Oz -o src/wasm/data.js \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=loadWasm \
    -s EXPORTED_FUNCTIONS="[_pack, _malloc, _free]" \
    -s SINGLE_FILE=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ENVIRONMENT=worker
