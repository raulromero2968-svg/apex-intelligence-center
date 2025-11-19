export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  locked?: boolean;
  lockoutUntil?: Date;
}

export interface BiometricConfig {
  maxAttempts?: number;
  lockoutDuration?: number; // in milliseconds
  promptMessage?: string;
  fallbackLabel?: string;
}
