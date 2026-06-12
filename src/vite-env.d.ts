/// <reference types="vite/client" />

interface Window {
  terminalShell?: {
    platform: string;
    packagedAt: string;
    apiBase?: string;
  };
}
