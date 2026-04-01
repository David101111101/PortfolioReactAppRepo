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
  /**
 * Detects abnormal symbol density while allowing all human languages
 */
  function hasHighSymbolDensity(input: string): boolean {
    if (!input || input.length < 20) return false;

    const nonTextCount = input.replace(/[\p{L}\p{N}\p{P}\s]/gu, "").length;
    const ratio = nonTextCount / input.length;

    return ratio > 0.4;
  }

  if (hasHighSymbolDensity(normalized)) {
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