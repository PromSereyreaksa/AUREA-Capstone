/**
 * Input Sanitization Utilities
 * Provides sanitization functions to prevent prompt injection and XSS attacks.
 */

/**
 * Sanitizes user input for safe inclusion in AI prompts.
 * Prevents prompt injection attacks by:
 * 1. Removing control characters and special sequences
 * 2. Escaping prompt-manipulation patterns
 * 3. Limiting input length
 * 4. Removing potentially harmful keywords
 */
export const sanitizeForAIPrompt = (input: string, maxLength: number = 500): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // 1. Remove control characters (except basic whitespace)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Remove potential prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/gi,
    /forget\s+(everything|all)\s+(you|i)\s+(know|said|told)/gi,
    /new\s+instructions?:/gi,
    /system\s*prompt:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /<<SYS>>/gi,
    /<\/SYS>>/gi,
    /###\s*instruction/gi,
    /###\s*response/gi,
    /human:/gi,
    /assistant:/gi,
    /user:/gi,
    /ai:/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }

  // 3. Remove markdown/code blocks that could contain malicious content
  sanitized = sanitized.replace(/```[\s\S]*?```/g, '[code-removed]');
  sanitized = sanitized.replace(/`[^`]+`/g, '[code-removed]');

  // 4. Escape special characters that could affect prompt structure
  sanitized = sanitized
    .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines
    .replace(/#{2,}/g, '#')     // Limit consecutive hashes
    .replace(/\*{2,}/g, '*')    // Limit consecutive asterisks
    .replace(/_{2,}/g, '_')     // Limit consecutive underscores

  // 5. Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...[truncated]';
  }

  // 6. Final trim
  return sanitized.trim();
};

/**
 * Sanitizes user input for general display purposes.
 * Prevents XSS attacks by escaping HTML entities.
 */
export const sanitizeForDisplay = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates and sanitizes skill input specifically.
 * Skills should be comma-separated simple text.
 */
export const sanitizeSkillsInput = (skills: string): string => {
  if (!skills || typeof skills !== 'string') {
    return '';
  }

  // Split by comma, sanitize each skill, rejoin
  const sanitizedSkills = skills
    .split(',')
    .map(skill => {
      // Remove non-alphanumeric except spaces and common characters
      let clean = skill.trim()
        .replace(/[^\w\s\-\.&\/()]/g, '')
        .substring(0, 100);
      return clean;
    })
    .filter(skill => skill.length > 0)
    .slice(0, 20);  // Max 20 skills

  return sanitizedSkills.join(', ');
};

/**
 * Validates and sanitizes region input.
 */
export const sanitizeRegionInput = (region: string): string => {
  if (!region || typeof region !== 'string') {
    return 'cambodia';
  }

  // Allow only alphanumeric, spaces, and underscores
  const sanitized = region.trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .substring(0, 50);

  // If empty after sanitization, default to cambodia
  return sanitized || 'cambodia';
};

/**
 * Validates enum-like inputs against allowed values.
 */
export const validateEnumInput = <T extends string>(
  input: string,
  allowedValues: T[],
  defaultValue: T
): T => {
  if (!input || typeof input !== 'string') {
    return defaultValue;
  }

  const normalized = input.toLowerCase().trim() as T;
  return allowedValues.includes(normalized) ? normalized : defaultValue;
};

export default {
  sanitizeForAIPrompt,
  sanitizeForDisplay,
  sanitizeSkillsInput,
  sanitizeRegionInput,
  validateEnumInput
};
