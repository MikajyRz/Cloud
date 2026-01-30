/// <reference types="vite/client" />

type ImportMetaEnvVars = {
  readonly VITE_API_URL?: string
  readonly VITE_TILESERVER_URL?: string
}

interface ImportMetaEnv extends ImportMetaEnvVars {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
