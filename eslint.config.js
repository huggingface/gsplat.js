import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base JavaScript config
  js.configs.recommended,
  
  // TypeScript files
  {
    files: ['src/**/*.ts', 'examples/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        XMLHttpRequest: 'readonly',
        
        // HTML Elements
        HTMLElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDialogElement: 'readonly',
        HTMLProgressElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        
        // Events
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        WheelEvent: 'readonly',
        TouchEvent: 'readonly',
        PointerEvent: 'readonly',
        
        // WebGL
        WebGLRenderingContext: 'readonly',
        WebGL2RenderingContext: 'readonly',
        WebGLProgram: 'readonly',
        WebGLShader: 'readonly',
        WebGLBuffer: 'readonly',
        WebGLTexture: 'readonly',
        WebGLUniformLocation: 'readonly',
        WebGLVertexArrayObject: 'readonly',
        WebGLFramebuffer: 'readonly',
        WebGLRenderbuffer: 'readonly',
        
        // Web Workers
        Worker: 'readonly',
        self: 'readonly',
        importScripts: 'readonly',
        
        // Text processing
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        
        // Other Web APIs
        performance: 'readonly',
        Image: 'readonly',
        ImageData: 'readonly',
        OffscreenCanvas: 'readonly',
        createImageBitmap: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for WASM modules
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions for production code
      '@typescript-eslint/ban-ts-comment': 'warn',
      
      // Prettier integration
      'prettier/prettier': 'error',
      
      // General rules
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-undef': 'error',
      
      // Allow worker imports with special syntax
      'import/no-unresolved': 'off'
    }
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.js',
      '*.mjs',
      '*.d.ts',
      'examples/**/node_modules/**',
      'examples/**/dist/**',
      'src/wasm/*.js' // Generated WASM files
    ]
  }
];