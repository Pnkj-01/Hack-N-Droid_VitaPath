export class SafetyError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'SafetyError';
  }
}

export const ErrorCodes = {
  LOCATION_DENIED: 'LOCATION_DENIED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SAFETY_SERVICE_ERROR: 'SAFETY_SERVICE_ERROR',
  PREDICTION_ERROR: 'PREDICTION_ERROR',
} as const; 