

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Augment the NodeJS namespace to include ProcessEnv
// This allows process.env.API_KEY to be typed correctly without declaring 'var process'
declare namespace NodeJS {
  // FIX: Removed duplicate index signature. The base NodeJS.ProcessEnv already has one.
  // We only need to add the specific keys we use.
  interface ProcessEnv {
    API_KEY: string;
  }
}