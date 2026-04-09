/**
 * Security middleware and configuration for API requests
 */

import { loadAdminSession } from '@/lib/api';

/**
 * Error handler with proper logging
 */
export class SecurityError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Verifies user authentication and permissions
 */
export const verifyAuth = async () => {
  try {
    const session = await loadAdminSession();

    if (!session) {
      throw new SecurityError('AUTH_REQUIRED', 'User must be authenticated', 401);
    }

    return session;
  } catch (error) {
    if (error instanceof SecurityError) throw error;
    throw new SecurityError('AUTH_ERROR', 'Authentication check failed', 500);
  }
};

/**
 * Verifies user is admin
 * Note: Currently checks if user is authenticated. 
 * In production, implement proper admin role management via custom claims or a profiles table.
 */
export const verifyAdmin = async () => {
  try {
    const user = await verifyAuth();
    
    // TODO: Implement proper admin role checking when profiles table is added
    // For now, this just verifies user is authenticated
    // In production, check user metadata or custom claims:
    // const userMetadata = user.user_metadata;
    // if (userMetadata?.role !== 'admin') { ... }
    
    return user;
  } catch (error) {
    if (error instanceof SecurityError) throw error;
    throw new SecurityError('ADMIN_CHECK_ERROR', 'Admin verification failed', 500);
  }
};

/**
 * Sanitizes database query parameters to prevent injection
 */
export const sanitizeQueryParams = (params: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(params)) {
    // Only allow alphanumeric and underscore in keys
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      continue;
    }
    
    if (value === null || value === undefined) {
      sanitized[key] = null;
    } else if (typeof value === 'string') {
      // Remove potential SQL injection attempts
      sanitized[key] = value
        .replace(/[;-]/g, '') // Remove SQL comment syntax
        .replace(/(['"])/g, '\\$1') // Escape quotes
        .slice(0, 1000); // Limit length
    } else if (typeof value === 'number') {
      sanitized[key] = Number.isFinite(value) ? value : 0;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = value.map(v => 
        typeof v === 'string' ? v.slice(0, 100) : v
      );
    }
  }
  
  return sanitized;
};

/**
 * Validates and sanitizes file uploads
 */
export const validateFileUpload = (file: File, options?: {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  } = options || {};
  
  const errors: string[] = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must not exceed ${maxSize / 1024 / 1024}MB`);
  }
  
  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedMimeTypes.join(', ')}`);
  }
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension must be one of: ${allowedExtensions.join(', ')}`);
  }
  
  // Check for suspicious filenames
  if (/[<>:"|?*]/.test(file.name) || file.name.includes('..')) {
    errors.push('Invalid filename');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Wraps async functions to handle security errors
 */
export const withSecurityErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data?: T; error?: SecurityError }> => {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    if (error instanceof SecurityError) {
      console.error(`[${context || 'SECURITY'}] ${error.code}: ${error.message}`);
      return { error };
    }
    
    console.error(`[${context || 'SECURITY'}] Unexpected error:`, error);
    return { 
      error: new SecurityError('INTERNAL_ERROR', 'An unexpected error occurred', 500) 
    };
  }
};

/**
 * Headers to add to all API requests for security
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
  };
};

/**
 * Log security events
 */
export const logSecurityEvent = (
  eventType: string,
  details: Record<string, unknown>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    severity,
    details,
    userAgent: navigator.userAgent,
  };
  
  console.warn(`[SECURITY] ${severity.toUpperCase()}: ${eventType}`, logEntry);
  
  // In production, send to monitoring service
  // await sendToMonitoringService(logEntry);
};

export default {
  SecurityError,
  verifyAuth,
  verifyAdmin,
  sanitizeQueryParams,
  validateFileUpload,
  withSecurityErrorHandling,
  getSecurityHeaders,
  logSecurityEvent
};
