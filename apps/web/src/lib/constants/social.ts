/**
 * Official social media profiles for Apex Intelligence
 * Used for sameAs JSON-LD and footer/about page links
 */

export const SOCIAL_PROFILES = {
  twitter: 'https://x.com/TCGAISociety',
  linkedin: 'https://linkedin.com/company/tcgaisociety',
  instagram: 'https://instagram.com/TCGAISociety',
  github: 'https://github.com/raulromero2968-svg/apex-intelligence-center',
} as const;

export const SAME_AS_LINKS = [
  SOCIAL_PROFILES.twitter,
  SOCIAL_PROFILES.linkedin,
  SOCIAL_PROFILES.instagram,
  SOCIAL_PROFILES.github,
] as const;
