 /**
 * Injection Guard
 * If a suspicious pattern is detected, the function returns a response immediately, which exits the *handler and prevents any further code—including the RAG pipeline—from executing
 */

import {  piiPatterns, SSRF, CommandInjection, promptInjectionPatterns,  dataExfiltrationPatterns,  sqlInjectionPatterns,  xssPatterns,  encodingPatterns, normalizeInput }
from "../common/constants";

export interface GuardResult {
  allowed: boolean;
  category?: string;
  matchedPattern?: string;
}
const patternGroups: Record<string, string[]> = {
  COMMAND_INJECTION: CommandInjection,
  SSRF: SSRF,
  PROMPT_INJECTION: promptInjectionPatterns,
  DATA_EXFILTRATION: dataExfiltrationPatterns,
  SQL_INJECTION: sqlInjectionPatterns,
  XSS: xssPatterns,
  ENCODED_PAYLOAD: encodingPatterns,
};

/**
 * Main guard function
 */
export function inspectPrompt(input: string): GuardResult {
  const normalized = normalizeInput(input);

  // Length protection
  if (normalized.length > 1000) {
    return {
      allowed: false,
      category: "INPUT_TOO_LARGE",
    };
  }

  // High symbol density detection
  // Allow Latin letters, digits, CJK (Chinese, Japanese, Korean), and Indic (Devanagari) characters
  const highSymbolDensity = /[^\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0900-\u097Fa-z0-9\s]{7,}/i;

  if (highSymbolDensity.test(normalized)) {
    return {
      allowed: false,
      category: "HIGH_SYMBOL_DENSITY",
    };
  }

  // PII detection
    for (const pattern of piiPatterns) {
      if (pattern.test(input)) {
        return {
          allowed: false,
          category: "PERSONAL_INFORMATION",
        };
      }
    }

  // Pattern matching
  for (const [category, patterns] of Object.entries(patternGroups)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return {
          allowed: false,
          category,
          matchedPattern: pattern,
        };
      }
    }
  }

  return { allowed: true };
}