 /**
 * Injection Guard
 * If a suspicious pattern is detected, the function returns a response immediately, which exits the *handler and prevents any further code—including the RAG pipeline—from executing
 */

import {  promptInjectionPatterns,  dataExfiltrationPatterns,  sqlInjectionPatterns,  xssPatterns,  encodingPatterns, normalizeInput }
from "../common/constants";

export interface GuardResult {
  allowed: boolean;
  category?: string;
  matchedPattern?: string;
}
const patternGroups: Record<string, string[]> = {
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
  const highSymbolDensity = /[^a-z0-9\s]{10,}/;
  if (highSymbolDensity.test(normalized)) {
    return {
      allowed: false,
      category: "HIGH_SYMBOL_DENSITY",
    };
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