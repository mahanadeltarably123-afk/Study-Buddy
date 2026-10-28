

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GEMINI_API_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Augment the NodeJS namespace to include ProcessEnv
// This allows process.env.API_KEY to be typed correctly without declaring 'var process'
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}