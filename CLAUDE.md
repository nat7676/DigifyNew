# CLAUDE.md - DigifyNew

This file provides guidance to Claude Code (claude.ai/code) when working with the DigifyNew codebase.

## Project Overview

DigifyNew is a complete rebuild of the Digify application using modern Vue 3 architecture with:
- Vue 3.5+ with Composition API
- Vuetify 3.8+ for UI components
- TypeScript 5.8+ with strict mode
- Pinia for state management
- Vite 6+ as build tool
- Socket.io for real-time communication

## Critical Architecture Decisions

### 1. Shared Modules Are Sacred
The following modules from DigifyOld MUST be copied exactly without modification:
- `/src/modules/shared.ts` - Core types and interfaces
- `/src/modules/sharedhelpers.ts` - Utility functions
These modules define the contract with the server and cannot be changed.

### 2. Server Communication Protocol
- All server communication objects must maintain exact same structure
- No changes to property names, casing, or types
- Server expects specific formats that cannot be altered

### 3. Modern Architecture Patterns
- Use Composition API exclusively (no Options API)
- Implement proper TypeScript with strict mode
- Use Pinia stores for state management
- Create composables for reusable logic
- Follow Vue 3 best practices

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm run test
```

## Architecture

### Directory Structure
```
src/
├── assets/          # Static assets and styles
├── components/      # Reusable Vue components
│   ├── ui/         # Base UI components
│   └── dashboard-modules/ # Dashboard specific modules
├── composables/     # Vue composables for shared logic
├── core/           # Core application components
├── modules/        # Business logic modules
│   ├── shared/     # Shared modules (DO NOT MODIFY)
│   └── registry/   # Module registration system
├── plugins/        # Vue plugins (Vuetify, etc.)
├── router/         # Vue Router configuration
├── services/       # API and external services
├── stores/         # Pinia stores
├── types/          # TypeScript type definitions
└── views/          # Page components
```

### Key Architectural Components

#### 1. Authentication System
- JWT token-based authentication
- Support for mobile/password and Microsoft SSO
- Token refresh logic before expiry
- Multi-system support (users can belong to multiple systems)

#### 2. Socket.io Integration
- Real-time bidirectional communication
- Multiple server connections for redundancy
- Request/response pattern with GUIDs
- Automatic reconnection handling

#### 3. State Management (Pinia)
- `auth` store - Authentication and user session
- `system` store - System configuration and settings
- `ui` store - UI preferences and theme
- `company` store - Company data cache
- `user` store - User profile and preferences

#### 4. Module System
- Dynamic module registration
- Lazy loading for performance
- Module access control based on roles
- Backward compatibility layer for legacy code

#### 5. Dashboard Architecture
- Component-based dashboard system
- Drag-and-drop layout editing
- Module settings persistence
- Real-time preview and editing

### Authentication Flow

1. User enters mobile/password or uses Microsoft SSO
2. Server returns JWT token with structure:
   ```typescript
   {
     PortalID: number,
     systemid: number,
     userid: number,
     AccessLevelID: number,
     roles: { [RoleID: number]: boolean },
     expire: number,
     SessionID: string
   }
   ```
3. Token stored in localStorage per system
4. Bearer token added to all API requests
5. Automatic refresh 30 minutes before expiry

### Development Guidelines

1. **TypeScript Usage**
   - Enable strict mode in tsconfig.json
   - Always define interfaces for component props
   - Use proper type annotations (no `any` unless necessary)
   - Define return types for all functions

2. **Vue 3 Patterns**
   - Use `<script setup>` syntax for all components
   - Implement proper prop validation with TypeScript
   - Use composables for shared logic
   - Follow Vue 3 style guide

3. **State Management**
   - Use Pinia stores for global state
   - Keep component state local when possible
   - Implement proper getters and actions
   - Use TypeScript interfaces for store state

4. **Error Handling**
   - Implement try-catch blocks for async operations
   - Use global error handler for unhandled errors
   - Show user-friendly error messages
   - Log errors to console in development

5. **Performance**
   - Lazy load routes and heavy components
   - Use virtual scrolling for large lists
   - Implement proper memoization
   - Optimize bundle size with tree shaking

### Testing Strategy

1. **Unit Tests**
   - Test composables and utilities
   - Test Pinia store actions
   - Use Vitest for fast execution

2. **Component Tests**
   - Test component behavior
   - Test prop validation
   - Test event emissions

3. **Integration Tests**
   - Test authentication flow
   - Test API interactions
   - Test socket.io connections

### Security Considerations

1. Never store sensitive data in localStorage
2. Validate all user inputs
3. Sanitize HTML content with DOMPurify
4. Use HTTPS for all communications
5. Implement proper CORS policies

### Migration Notes

When migrating components from DigifyOld:
1. Convert Options API to Composition API
2. Update to modern TypeScript patterns
3. Replace global properties with composables
4. Update Vuetify 2 syntax to Vuetify 3
5. Ensure all server communication remains unchanged

## Module Development

### Creating a New Dashboard Module

1. Add module enum to shared types
2. Create component in `/src/components/dashboard-modules/`
3. Register in module registry
4. Follow the dashboard module template pattern

### Dashboard Module Template
```vue
<template>
  <v-card>
    <v-card-title v-if="showHeader">
      {{ title }}
    </v-card-title>
    <v-card-text>
      <!-- Module content -->
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardElement } from '@/types/dashboard'

interface Props {
  element: DashboardElement
}

const props = defineProps<Props>()

const title = computed(() => props.element.title || 'Module Title')
const showHeader = computed(() => props.element.showHeader !== false)
</script>
```

## Common Pitfalls to Avoid

1. **Do NOT modify shared modules** - They define server contracts
2. **Do NOT change object keys or casing** - Server expects exact formats
3. **Do NOT use Options API** - Use Composition API exclusively
4. **Do NOT use any type** - Define proper TypeScript interfaces
5. **Do NOT ignore error handling** - Implement proper try-catch blocks

## Performance Optimization

1. Use dynamic imports for route components
2. Implement virtual scrolling for large lists
3. Lazy load heavy dependencies
4. Use web workers for CPU-intensive tasks
5. Implement proper caching strategies

## Deployment

1. Build optimized production bundle
2. Enable gzip compression
3. Set up proper caching headers
4. Use CDN for static assets
5. Monitor performance metrics