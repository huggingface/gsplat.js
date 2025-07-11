# Contributing to gsplat.js

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build WASM: `npm run build:wasm`
4. Build library: `npm run build`

## Testing

- Run tests: `npm test`
- Lint code: `npm run lint`
- Format code: `npm run format`

## Making Changes

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass and code is linted
4. Update version in `package.json` if needed
5. Create a pull request

## File Structure

- `src/` - TypeScript source code
- `examples/` - Example applications
- `playground/` - Development testing (gitignored)
- `dist/` - Built library output

## Release Process

Releases are handled through GitHub Actions workflows. The build process includes WebAssembly compilation using Emscripten.