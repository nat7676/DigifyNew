/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_USE_REDESIGN: string
  readonly VITE_API_URL: string
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}