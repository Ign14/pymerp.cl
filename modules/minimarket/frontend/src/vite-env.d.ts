/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MINIMARKET_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
