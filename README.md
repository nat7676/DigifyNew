# DigifyNew

Modern Vue 3 rebuild of the Digify application with Vuetify 3, TypeScript, and Composition API.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Development

The application runs on http://localhost:8091 (or next available port).

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Architecture

- **Framework**: Vue 3 with Composition API
- **UI Library**: Vuetify 3
- **State Management**: Pinia
- **Build Tool**: Vite
- **Language**: TypeScript
- **Real-time**: Socket.io

### Project Structure

```
src/
├── assets/          # Static assets and styles
├── components/      # Reusable Vue components
├── composables/     # Vue composables
├── core/           # Core application components
├── modules/        # Business logic modules
│   └── shared/     # DO NOT MODIFY - Server contracts
├── plugins/        # Vue plugins
├── router/         # Vue Router configuration
├── services/       # API and services
├── stores/         # Pinia stores
├── types/          # TypeScript types
└── views/          # Page components
```

### Important Notes

- DO NOT modify files in `src/modules/shared/` - these define server contracts
- Maintain exact server communication structure
- Use Composition API for all components
- Follow TypeScript strict mode

For detailed documentation, see [CLAUDE.md](./CLAUDE.md) and [TODO.md](./TODO.md).