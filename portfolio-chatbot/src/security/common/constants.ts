
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

/**
 * Pattern categories
 */
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