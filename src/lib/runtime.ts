export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiBase = window.terminalShell?.apiBase;
  if (!apiBase) return normalizedPath;
  return `${apiBase.replace(/\/$/, '')}${normalizedPath}`;
}

export function isElectronDesktop() {
  return Boolean(window.terminalShell);
}
