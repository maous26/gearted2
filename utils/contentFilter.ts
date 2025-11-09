/**
 * Content filtering utilities to prevent sharing of personal contact information
 */

// Regex patterns for detecting phone numbers and emails
const PHONE_PATTERNS = [
  /\b0[1-9](?:[\s.-]?\d{2}){4}\b/g, // French format: 06 12 34 56 78
  /\b(?:\+33|0033)[1-9](?:[\s.-]?\d{2}){4}\b/g, // International French: +33 6 12 34 56 78
  /\b\d{10}\b/g, // 10 consecutive digits
  /\b\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}\b/g, // Spaced/separated
];

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Additional patterns to catch obfuscated attempts
const OBFUSCATED_PATTERNS = [
  /\b0\s*[1-9](?:\s*\d){8}\b/g, // Spaced numbers
  /\b(?:zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)[\s-]*(?:zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)/gi, // Numbers spelled out
  /\b[a-z0-9]+\s*(?:at|arobase|@)\s*[a-z]+\s*(?:dot|point)\s*[a-z]+\b/gi, // email spelled out
];

export interface FilterResult {
  isAllowed: boolean;
  filteredText: string;
  violations: string[];
}

/**
 * Check if text contains phone numbers or email addresses
 */
export function containsContactInfo(text: string): boolean {
  // Check phone patterns
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  
  // Check email pattern
  if (EMAIL_PATTERN.test(text)) return true;
  
  // Check obfuscated patterns
  for (const pattern of OBFUSCATED_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  
  return false;
}

/**
 * Filter message content and return result with violations
 */
export function filterMessageContent(text: string): FilterResult {
  const violations: string[] = [];
  let filteredText = text;
  
  // Check and replace phone numbers
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) {
      violations.push('numéro de téléphone');
      filteredText = filteredText.replace(pattern, '[NUMÉRO MASQUÉ]');
    }
  }
  
  // Check and replace emails
  if (EMAIL_PATTERN.test(text)) {
    violations.push('adresse email');
    filteredText = filteredText.replace(EMAIL_PATTERN, '[EMAIL MASQUÉ]');
  }
  
  // Check obfuscated patterns
  for (const pattern of OBFUSCATED_PATTERNS) {
    if (pattern.test(text)) {
      violations.push('contact obfusqué');
      filteredText = filteredText.replace(pattern, '[CONTENU MASQUÉ]');
    }
  }
  
  return {
    isAllowed: violations.length === 0,
    filteredText: violations.length > 0 ? filteredText : text,
    violations: [...new Set(violations)] // Remove duplicates
  };
}

/**
 * Get warning message for blocked content
 */
export function getBlockedContentWarning(violations: string[]): string {
  const items = violations.join(', ');
  return `⚠️ Interdit de partager : ${items}. Utilisez la messagerie sécurisée de Gearted pour communiquer.`;
}
