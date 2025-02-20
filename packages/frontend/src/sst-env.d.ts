/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SITE_API_URL: string
  readonly VITE_AUTH_URL: string
  readonly VITE_WS_API_URL: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}