
/**
 * Canonicalizes input to reduce bypass attempts
 */
export function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}
/* Personal Information Guard */

export const piiPatterns: RegExp[] = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/,
  /\b(?:\d[ -]*?){13,16}\b/,
  /\b\d{8,}\b/,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
  /\b[A-Za-z0-9_-]{32,}\b/,
];

/**
 * Pattern categories
 */
export const SSRF = [
  "http://localhost",
  "127.0.0.1",
  "file://",
  "metadata.google.internal"
]
export const CommandInjection = [
  "sudo",
  "rm -rf",
  "curl http",
  "chmod",
  "cmd.exe",
  "powershell",
  "wget",
];
export const promptInjectionPatterns = [
  "ignore previous",
  "ignore all instructions",
  "disregard above",
  "override system",
  "new instructions",
  "you are now",
  "act as",
  "roleplay as",
  "simulate",
  "pretend to be",
  "jailbreak",
  "bypass",
  "disable safety",
  "developer mode",
  "system prompt",
  "reveal prompt",
  "show hidden instructions",
  "print your instructions",
  "summarize your hidden instructions",
  "what were you told",
  "confidential instructions",
];

export const dataExfiltrationPatterns = [
  "show database",
  "dump database",
  "list all users",
  "export data",
  "internal documents",
  "confidential",
  "private key",
  "api key",
  "access token",
  "supabase key",
  "environment variables",
  "env file",
  ".env",
  "server config",
];

export const sqlInjectionPatterns = [
  "select * from",
  "union select",
  "drop table",
  "delete from",
  "insert into",
  "update set",
  "--",
  ";--",
  "/*",
  "*/",
  "@@",
  "char(",
  "nchar(",
  "varchar(",
  "cast(",
  "convert(",
  "or 1=1",
  "' or '1'='1",
];

export const xssPatterns = [
  "<script",
  "</script>",
  "javascript:",
  "onerror=",
  "onload=",
  "document.cookie",
  "window.location",
  "<iframe",
];

export const encodingPatterns = [
  "%27",
  "%3c",
  "%3e",
  "&#x",
  "base64,",
];