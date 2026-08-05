// Validation for the booking form. Pure predicates, no React and no copy —
// every message shown to a client comes from the dictionaries, so these only
// answer "is this acceptable?" and the caller picks the localised sentence.

/** ITU-T E.164: a subscriber number is at most 15 digits. */
const MAX_PHONE_DIGITS = 15;

/**
 * Shortest number we accept. Spanish mobiles are 9 digits, so a client may
 * reasonably type a local number without a country code.
 */
const MIN_PHONE_DIGITS = 9;

/** Minimum name length — one letter is almost always a typo. */
const MIN_NAME_LENGTH = 2;

/**
 * A name is acceptable once it has at least two non-space characters.
 * Deliberately permissive: names carry accents, apostrophes, hyphens and
 * Cyrillic, and no pattern that tries to be clever about that is kind to
 * everyone it should be.
 */
export function isValidName(value: string): boolean {
    return value.trim().length >= MIN_NAME_LENGTH;
}

/**
 * A phone number is acceptable when — ignoring the spaces, dashes, dots,
 * brackets and a single leading `+` people naturally type — what remains is
 * only digits, and there are between 9 and 15 of them.
 */
export function isValidPhone(value: string): boolean {
    const trimmed = value.trim();
    // Strip formatting a person would type; anything left must be a digit.
    const withoutSeparators = trimmed.replace(/^\+/, "").replace(/[\s\-().]/g, "");
    if (!/^\d+$/.test(withoutSeparators)) return false;

    const digits = withoutSeparators.length;
    return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
}
