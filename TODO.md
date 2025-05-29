# DigifyNew - Development TODO List

## Project Goal
Recreate DigifyOld with modern Vue 3/Vuetify 3/TypeScript/Composition API architecture while maintaining exact compatibility with the existing server infrastructure.

## Critical Constraints
- ✅ DO NOT modify shared.ts or sharedhelpers.ts (sacred modules)
- ✅ Maintain exact server communication structure (no key/case changes)
- ✅ ALL server communication goes through WebSocket (socket.io) - NO direct HTTP calls
- ✅ Use modern Vue 3 patterns exclusively (Composition API)
- ✅ Implement proper TypeScript with strict mode

## Progress Tracking

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Research DigifyOld structure and understand the application architecture
- [x] Create new Vue 3 project with Vuetify 3, TypeScript, ESLint, and Composition API
- [x] Create CLAUDE.md documentation
- [x] Set up directory structure
- [x] Configure build tools (Vite, TypeScript, ESLint)
- [x] Create basic application shell (App.vue, router, main.ts)

### ✅ Phase 2: Core Systems (COMPLETED)
- [x] Set up state management (Pinia stores)
  - [x] Auth store - JWT tokens, user session
  - [x] System store - Application config, domain settings
  - [x] UI store - Theme, notifications, loading states
- [x] Set up authentication system with login functionality
  - [x] Login view with mobile/password
  - [x] Token management and storage
  - [x] Session timeout handling
  - [x] Multi-system support
- [x] Create server communication layer (HTTP/AJAX)
  - [x] Axios wrapper with auth headers
  - [x] Error handling and retries
  - [x] Date conversion utilities
- [x] Implement socket.io handling for real-time communication
  - [x] Multi-server connections
  - [x] Load balancing (round-robin)
  - [x] Request/response pattern
  - [x] Subscription management
- [x] Add type definitions for shared modules

### ✅ Phase 2.5: Server Integration (COMPLETED)
- [x] Connect socket service to real servers
  - [x] Update server URLs to napi.digify.no
  - [x] Initialize socket connections on app start
- [x] Implement actual login API
  - [x] Create auth.service.ts with all login methods using WebSocket
  - [x] Update auth store to use socket.io communication
  - [x] ALL API calls go through NodeEvent.Api (no direct HTTP)
  - [x] Handle token storage and refresh
  - [x] Send AccessToken to socket servers
- [x] Implement template retrieval
  - [x] Create template.service.ts
  - [x] Portal settings loading with cache
  - [x] Dashboard layout retrieval with SHA256 keys
  - [x] Multi-level layout fallback system

### 🚧 Phase 3: Dashboard Framework (IN PROGRESS)
- [ ] Build dashboard framework and routing
  - [ ] Implement dynamic route loading from server
  - [ ] Create Dashboard.vue core component
  - [ ] Implement PageInner.vue for page settings
  - [ ] Create DashboardSection and DashboardSectionColumn components
  - [ ] Implement DashboardInfo.vue module loader
  - [ ] Add edit mode functionality (Ctrl+D toggle)
- [ ] Create module registration system
  - [ ] Port DashboardInfoEnum from shared.ts
  - [ ] Implement module registry pattern
  - [ ] Create module settings management
  - [ ] Add access control per module

### 📋 Phase 4: Dashboard Components (PENDING)
- [ ] Implement first dashboard component (InfoBox.vue)
  - [ ] Create component template
  - [ ] Add edit mode support
  - [ ] Implement settings persistence
- [ ] Create Card.vue wrapper component
  - [ ] Standard styling and loading states
  - [ ] Edit mode slot support
  - [ ] Access control handling
- [ ] Port essential dashboard modules
  - [ ] TextBox.vue
  - [ ] ButtonModule.vue
  - [ ] DataTable.vue
  - [ ] ChartModule.vue

### 🔧 Phase 5: Composables & Utilities (PENDING)
- [ ] Create composables for shared functionality
  - [ ] useGlobals() - Access to global state
  - [ ] useCache() - Cache management
  - [ ] useSocket() - Socket.io helpers
  - [ ] useAjax() - AJAX call helpers
  - [ ] useAccess() - Permission checking
- [ ] Port utility modules
  - [ ] Date formatting utilities
  - [ ] String helpers
  - [ ] Validation functions

### 🔌 Phase 6: Integration (PENDING)
- [ ] Connect socket service to UI components
  - [ ] Chat functionality
  - [ ] Real-time updates
  - [ ] Cache synchronization
- [ ] Implement cache system
  - [ ] Port cache configuration
  - [ ] Add change listeners
  - [ ] Implement cache types (Common, Customer, User)
- [ ] Add file upload/download support
  - [ ] Base64 encoding for uploads
  - [ ] Progress tracking
  - [ ] File type validation

### 🎯 Phase 7: Customer Features (PENDING)
- [ ] Port customer-specific modules
  - [ ] Company search and display
  - [ ] Contract management
  - [ ] Document handling
  - [ ] User management
- [ ] Implement role-based access control
  - [ ] Module-level permissions
  - [ ] Feature toggles
  - [ ] System-specific configurations

### 🧪 Phase 8: Testing & Polish (PENDING)
- [ ] Add unit tests for stores
- [ ] Add component tests
- [ ] Test all server communication
- [ ] Verify backward compatibility
- [ ] Performance optimization
- [ ] Error boundary implementation

## Known Issues & Blockers
- ✅ FIXED: Vuetify Sass loading errors (500 errors on component styles)
  - Solution: Updated vite.config.ts and vuetify plugin configuration
  - Removed redundant MDI font import from main.ts
- ✅ FIXED: Router injection error in auth store
  - Solution: Pass router instance via setRouterInstance method instead of using useRouter()
- ✅ FIXED: useTheme must be called from inside a setup function
  - Solution: Pass Vuetify instance to UI store instead of calling useTheme directly
- ✅ FIXED: "app is not a function" error during initialization
  - Solution: Configure auto-import plugin to exclude `createApp` to prevent global conflict
  - Explicitly list which Vue functions to auto-import
- ✅ FIXED: Incorrect HTTP implementation for login
  - Solution: Updated auth.service.ts to use WebSocket (socket.io) for ALL communication
  - All API calls now go through NodeEvent.Api event as in DigifyOld

## Current Status
- Application foundation is complete and working without errors
- Run `npm install` and `npm run dev` to start the application
- Login screen is accessible at http://localhost:8091
- All core systems are initialized properly
- No console errors

## Notes
- All server communication must remain exactly as in DigifyOld
- Focus on creating a clean, maintainable architecture
- Use TypeScript strict mode to catch errors early
- Implement proper error handling throughout
- Document complex logic and architectural decisions

## Testing Checklist
Before marking any component as complete:
- [ ] Component renders correctly
- [ ] TypeScript has no errors
- [ ] Server communication works as expected
- [ ] Edit mode functions properly (if applicable)
- [ ] Access control is enforced
- [ ] Error states are handled gracefully

---

Last Updated: [Current Date]
Next Priority: Build dashboard framework components