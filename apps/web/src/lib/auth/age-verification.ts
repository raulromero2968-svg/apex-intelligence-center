/**
 * Age Verification and Minor Protection Utilities
 *
 * Provides age calculation and minor status determination for COPPA compliance
 * and child protection. Minors (under 18) are automatically restricted from:
 * - Payment processing
 * - Wallet connections
 * - Token-gated features
 * - Subscription upgrades
 */

/**
 * Calculate age from birth date
 * @param birthDate - Date of birth
 * @param referenceDate - Date to calculate age from (defaults to today)
 * @returns Age in years
 */
export function calculateAge(
  birthDate: Date,
  referenceDate: Date = new Date()
): number {
  const birth = new Date(birthDate);
  const reference = new Date(referenceDate);

  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();

  // Adjust if birthday hasn't occurred yet this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && reference.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Determine if a person is a minor (under 18)
 * @param birthDate - Date of birth
 * @returns True if the person is under 18 years old
 */
export function isMinor(birthDate: Date): boolean {
  const age = calculateAge(birthDate);
  return age < 18;
}

/**
 * Validate birth date is reasonable and not in the future
 * @param birthDate - Date to validate
 * @returns True if birth date is valid
 */
export function isValidBirthDate(birthDate: Date): boolean {
  const now = new Date();
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 120); // Max 120 years old

  return birthDate <= now && birthDate >= minDate;
}

/**
 * Calculate when a minor will turn 18 (for informational purposes)
 * @param birthDate - Date of birth
 * @returns Date when person turns 18, or null if already 18+
 */
export function getAdultDate(birthDate: Date): Date | null {
  if (!isMinor(birthDate)) {
    return null;
  }

  const adultDate = new Date(birthDate);
  adultDate.setFullYear(adultDate.getFullYear() + 18);
  return adultDate;
}

/**
 * Format remaining time until adult status
 * @param birthDate - Date of birth
 * @returns Human-readable string of time until 18, or null if already 18+
 */
export function getTimeUntilAdult(birthDate: Date): string | null {
  const adultDate = getAdultDate(birthDate);
  if (!adultDate) {
    return null;
  }

  const now = new Date();
  const diffMs = adultDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;

  if (diffYears > 0) {
    return `${diffYears} year${diffYears > 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
}
