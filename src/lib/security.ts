/**
 * Security utilities for input validation and sanitization
 */

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate and sanitize text input (prevent XSS)
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remove dangerous HTML characters
  return text
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 500); // Limit length
};

// Validate URL format
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Sanitize URL
export const sanitizeUrl = (url: string): string => {
  if (!validateUrl(url)) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    return '';
  }
};

// Validate password strength
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain special character');
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Rate limiting utility
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);
    
    if (!record) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }
    
    if (now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }
    
    record.count++;
    return record.count > this.maxAttempts;
  }
  
  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    return Math.max(0, record.resetTime - Date.now());
  }
}

// CSRF token management
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure storage with encryption (basic implementation)
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      // In production, use proper encryption library like tweetnacl
      const encrypted = btoa(JSON.stringify({ data: value, timestamp: Date.now() }));
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = JSON.parse(atob(encrypted));
      // Check if data is older than 1 hour
      if (Date.now() - decrypted.timestamp > 3600000) {
        sessionStorage.removeItem(key);
        return null;
      }
      return decrypted.data;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    sessionStorage.removeItem(key);
  }
};

// Content validation helpers
export const validateFormData = (data: Record<string, unknown>, schema: Record<string, { type: string; required?: boolean; max?: number }>): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    if (value) {
      if (rules.type === 'email' && typeof value === 'string' && !validateEmail(value)) {
        errors[field] = 'Invalid email format';
      }
      if (rules.type === 'text' && typeof value !== 'string') {
        errors[field] = 'Must be text';
      }
      if (rules.max && typeof value === 'string' && value.length > rules.max) {
        errors[field] = `Must not exceed ${rules.max} characters`;
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  validateEmail,
  sanitizeText,
  validateUrl,
  sanitizeUrl,
  validatePassword,
  RateLimiter,
  generateCSRFToken,
  secureStorage,
  validateFormData
};
