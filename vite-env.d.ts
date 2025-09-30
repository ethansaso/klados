/// <reference types="vite/client" />

declare interface ViteTypeOptions {
  strictImportMetaEnv: true
}

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
  readonly VITE_GA_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
