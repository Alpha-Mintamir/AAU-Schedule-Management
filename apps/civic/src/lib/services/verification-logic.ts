/**
 * Pure verification-state logic, kept free of I/O so it can be unit tested.
 * The verification service applies these rules when recording events.
 */

export type VerificationStatus =
  | "official"
  | "officially_verified"
  | "community_verified"
  | "community_reported"
  | "outdated"
  | "disputed"
  | "unknown";

export type VerificationMethod =
  | "official_source_check"
  | "community_confirmation"
  | "moderator_review"
  | "in_person_check";

/**
 * Status resulting from a verification event. `official` is reserved for
 * content ingested directly from an official source and is never produced by
 * a verification event — verifying against a source yields
 * `officially_verified`.
 */
export function statusForVerification(method: VerificationMethod): VerificationStatus {
  switch (method) {
    case "official_source_check":
      return "officially_verified";
    case "community_confirmation":
    case "moderator_review":
    case "in_person_check":
      return "community_verified";
  }
}

/**
 * Whether a verification event may upgrade the current status. Outdated and
 * disputed states must be explicitly cleared by a moderator (via a
 * verification, which is allowed to clear them), but `official` is never
 * downgraded by community verification.
 */
export function nextStatus(
  current: VerificationStatus,
  method: VerificationMethod,
): VerificationStatus {
  if (current === "official" && method !== "official_source_check") {
    return current;
  }
  return statusForVerification(method);
}

/**
 * Trust threshold: a community note counts as community-verified when at
 * least `MIN_TRUSTED_CONFIRMATIONS` distinct trusted contributors (or higher
 * roles) confirmed it.
 */
export const MIN_TRUSTED_CONFIRMATIONS = 3;

export function isCommunityVerified(trustedConfirmations: number): boolean {
  return trustedConfirmations >= MIN_TRUSTED_CONFIRMATIONS;
}

/** Reputation awarded for accepted contributions, by kind. */
export const REPUTATION_REWARDS = {
  approvedContribution: 5,
  approvedNote: 2,
  confirmedNote: 1,
  resolvedAccurateFlag: 3,
} as const;
