#!/bin/bash
emcc wasm/hello.cpp -o src/wasm/hello.js \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=loadWasm \
    -s EXPORTED_FUNCTIONS="[_hello]" \
    -s SINGLE_FILE=1
