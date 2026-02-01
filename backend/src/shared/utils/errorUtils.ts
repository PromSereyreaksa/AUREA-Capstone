/**
 * Error Utilities
 * Provides utilities for safe error handling without leaking internal details.
 */

/**
 * Maps internal error messages to user-friendly messages.
 * Prevents information leakage while providing actionable feedback.
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Rate limiting
  'rate_limit': 'Service is currently busy. Please try again in a few minutes.',
  'quota_exceeded': 'Service quota temporarily exceeded. Please try again later.',
  
  // API/Network errors
  'network': 'Unable to connect to external services. Please try again.',
  'timeout': 'Request timed out. Please try again.',
  'connection': 'Connection issue. Please check your network and try again.',
  
  // Service errors
  'api_key': 'Service configuration issue. Please contact support.',
  'initialization': 'Service is temporarily unavailable. Please try again.',
  'empty_response': 'Unable to generate a response. Please try again with different input.',
  
  // Validation
  'invalid_input': 'Invalid input provided. Please check your data and try again.',
  'parsing': 'Unable to process the response. Please try again.',
  
  // Generic
  'unknown': 'An unexpected error occurred. Please try again later.',
};

/**
 * Determines the error category based on the original error.
 */
export const categorizeError = (error: any): string => {
  const message = (error?.message || '').toLowerCase();
  const code = error?.code?.toString().toLowerCase() || '';

  // Rate limiting
  if (
    message.includes('rate') ||
    message.includes('quota') ||
    message.includes('429') ||
    code === '429'
  ) {
    return 'rate_limit';
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('fetch failed')
  ) {
    return 'network';
  }

  // Timeout
  if (message.includes('timeout') || message.includes('etimedout')) {
    return 'timeout';
  }

  // Connection
  if (message.includes('connection')) {
    return 'connection';
  }

  // API key issues
  if (message.includes('api key') || message.includes('apikey') || message.includes('unauthorized')) {
    return 'api_key';
  }

  // Initialization
  if (message.includes('initialize') || message.includes('init')) {
    return 'initialization';
  }

  // Empty response
  if (message.includes('empty response') || message.includes('no response')) {
    return 'empty_response';
  }

  // Parsing
  if (message.includes('json') || message.includes('parse')) {
    return 'parsing';
  }

  // Invalid input
  if (message.includes('invalid') || message.includes('validation')) {
    return 'invalid_input';
  }

  return 'unknown';
};

/**
 * Gets a safe, user-friendly error message without internal details.
 */
export const getSafeErrorMessage = (error: any, context?: string): string => {
  const category = categorizeError(error);
  const baseMessage = ERROR_MESSAGE_MAP[category] || ERROR_MESSAGE_MAP['unknown'];
  
  if (context) {
    return `${context}: ${baseMessage}`;
  }
  
  return baseMessage;
};

/**
 * Logs the full error details for debugging while returning a safe message.
 * Use this in catch blocks to maintain security while debugging.
 */
export const handleAndLogError = (
  error: any, 
  context: string,
  logPrefix: string = '[ERROR]'
): string => {
  // Log full details for debugging (server-side only)
  console.error(`${logPrefix} ${context}:`, {
    message: error?.message,
    code: error?.code,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Return safe message for user
  return getSafeErrorMessage(error, context);
};

/**
 * Creates a sanitized error object for external responses.
 */
export const createSafeError = (error: any, context?: string) => {
  const safeMessage = getSafeErrorMessage(error, context);
  const category = categorizeError(error);
  
  return {
    message: safeMessage,
    category,
    // Only include retry hint for transient errors
    retryable: ['rate_limit', 'network', 'timeout', 'connection', 'empty_response'].includes(category),
  };
};

export default {
  categorizeError,
  getSafeErrorMessage,
  handleAndLogError,
  createSafeError,
};
