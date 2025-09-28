interface ErrorEvent {
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  category: 'trading' | 'wallet' | 'price-feed' | 'ui';
  message: string;
  stack?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorService {
  private errors: ErrorEvent[] = [];
  private maxErrors = 1000;

  logError(
    category: ErrorEvent['category'], 
    message: string, 
    error?: Error, 
    metadata?: Record<string, any>
  ) {
    // ✅ FIXED: Only include optional properties if they exist
    const errorEvent: ErrorEvent = {
      timestamp: Date.now(),
      level: 'error',
      category,
      message,
      ...(error?.stack && { stack: error.stack }),
      ...(metadata && { metadata })
    };

    this.errors.push(errorEvent);
    
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Console for development
    console.error(`🚨 [${category}] ${message}`, error, metadata);
  }

  logWarning(
    category: ErrorEvent['category'], 
    message: string, 
    metadata?: Record<string, any>
  ) {
    // ✅ FIXED: Only include optional properties if they exist
    const warningEvent: ErrorEvent = {
      timestamp: Date.now(),
      level: 'warning',
      category,
      message,
      ...(metadata && { metadata })
    };

    this.errors.push(warningEvent);
    console.warn(`⚠️ [${category}] ${message}`, metadata);
  }

  getRecentErrors(count: number = 50): ErrorEvent[] {
    return this.errors.slice(-count);
  }

  getErrorsByCategory(category: ErrorEvent['category']): ErrorEvent[] {
    return this.errors.filter(e => e.category === category);
  }

  clearErrors(): void {
    this.errors = [];
  }
}

export const errorService = new ErrorService();
