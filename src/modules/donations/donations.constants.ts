/**
 * Donation Source Constants
 * Numeric enum values for donation_by field
 */
export const DONATION_SOURCE = {
  INDIVIDUAL: 0,
  ORGANIZATION: 1,
  ANONYMOUS: 2,
} as const;

export type DonationSourceType = typeof DONATION_SOURCE[keyof typeof DONATION_SOURCE];

/**
 * Reverse mapping for display purposes
 */
export const DONATION_SOURCE_LABELS: Record<DonationSourceType, string> = {
  [DONATION_SOURCE.INDIVIDUAL]: "individual",
  [DONATION_SOURCE.ORGANIZATION]: "organization",
  [DONATION_SOURCE.ANONYMOUS]: "anonymous",
};

/**
 * Helper to convert string to enum value
 */
export const stringToDonationSource = (value: string): DonationSourceType | null => {
  const mapping: Record<string, DonationSourceType> = {
    individual: DONATION_SOURCE.INDIVIDUAL,
    organization: DONATION_SOURCE.ORGANIZATION,
    anonymous: DONATION_SOURCE.ANONYMOUS,
  };
  return mapping[value.toLowerCase()] ?? null;
};
