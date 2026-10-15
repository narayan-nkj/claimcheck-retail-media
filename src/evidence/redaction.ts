/**
 * Field names that should be automatically redacted from evidence payloads
 */
const SENSITIVE_KEY_PATTERNS = [
  /api[-_]?key/i,
  /secret/i,
  /token/i,
  /auth/i,
  /password/i,
  /credential/i,
  /bearer/i,
  /wholesale[-_]?cost/i,
  /profit[-_]?margin/i,
  /customer[-_]?(ssn|sin|id|name|phone|email)/i,
];

/**
 * Value regexes for sensitive data detection (credit cards, emails, tokens)
 */
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const BEARER_OR_KEY_REGEX = /(?:bearer\s+[a-zA-Z0-9_\-\.]{16,}|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,})/gi;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;

/**
 * Redact sensitive string values
 */
export function redactSensitiveString(val: string): string {
  return val
    .replace(BEARER_OR_KEY_REGEX, '[REDACTED_SECRET]')
    .replace(CREDIT_CARD_REGEX, '[REDACTED_CARD]')
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
}

/**
 * Recursively redact sensitive keys and values from an evidence object
 */
export function redactSensitiveData<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    if (typeof input === 'string') {
      return redactSensitiveString(input) as unknown as T;
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

    if (isSensitiveKey) {
      result[key] = '[REDACTED_CONFIDENTIAL]';
    } else if (typeof value === 'string') {
      result[key] = redactSensitiveString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
