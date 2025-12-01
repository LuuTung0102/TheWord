/**
 * Regex Constants - Compile regex patterns một lần để tái sử dụng
 * Tránh tạo lại regex mỗi lần sử dụng, cải thiện performance
 */

// ============ VALIDATION PATTERNS ============

// CCCD validation: 9 hoặc 12 chữ số
const CCCD_PATTERN = /^\d{9}$|^\d{12}$/;

// Phone number validation: 10 chữ số
const PHONE_PATTERN = /^\d{10}$/;

// MST validation: 10 hoặc 13 chữ số
const MST_PATTERN = /^\d{10}$|^\d{13}$/;

// ============ EXTRACTION PATTERNS ============

// Loại đất patterns
const LAND_CODE_PATTERN = /^([A-Z]+)/i;
const LAND_CODE_AREA_PATTERN = /^([A-Z]+)\s+(\d+(?:\.\d+)?)/i;
const AREA_LAND_CODE_PATTERN = /^(\d+(?:\.\d+)?)\s*m2?\s+([A-Z]+)/i;
const LAND_CODE_ONLY_PATTERN = /^([A-Z]+)$/i;

// Land type detail patterns
const LAND_DETAIL_CODE_AREA_PATTERN = /^([A-Z]+)\s+(\d+(?:\.\d+)?)\s*m2?$/i;
const LAND_DETAIL_AREA_CODE_PATTERN = /^(\d+(?:\.\d+)?)\s*m2?\s*([A-Z]+)$/i;

// Name pattern: Name1, Name2, etc.
const NAME_NUMBER_PATTERN = /^Name(\d+)$/;

// ============ CLEANING PATTERNS ============

// Remove non-digits
const NON_DIGIT_PATTERN = /\D/g;

// Remove non-numeric (keep dots)
const NON_NUMERIC_PATTERN = /[^\d.]/g;

// Remove dots
const DOT_PATTERN = /\./g;

// Remove commas
const COMMA_PATTERN = /,/g;

// Remove all non-alphanumeric except dash and underscore
const SAFE_ID_PATTERN = /[^a-zA-Z0-9-_]/g;

// ============ FORMATTING PATTERNS ============

// Format thousands separator
const THOUSANDS_PATTERN = /\B(?=(\d{3})+(?!\d))/g;

// Multiple spaces to single space
const MULTIPLE_SPACES_PATTERN = / +/g;

// Forward slash to backslash
const FORWARD_SLASH_PATTERN = /\//g;

// Remove m2 suffix
const M2_SUFFIX_PATTERN = /m2/g;

// ============ ADDRESS PATTERNS ============

// Address prefixes to remove
const ADDRESS_PREFIX_T_PATTERN = /T\. /g;
const ADDRESS_PREFIX_TP_PATTERN = /TP\. /g;
const ADDRESS_PREFIX_H_PATTERN = /H\. /g;
const ADDRESS_PREFIX_Q_PATTERN = /Q\. /g;
const ADDRESS_PREFIX_TX_PATTERN = /TX\. /g;
const ADDRESS_PREFIX_XA_PATTERN = /Xã /g;
const ADDRESS_PREFIX_PHUONG_PATTERN = /Phường /g;
const ADDRESS_PREFIX_TT_PATTERN = /TT\. /g;
const ADDRESS_PREFIX_THON_PATTERN = /Thôn /g;
const ADDRESS_PREFIX_BUON_PATTERN = /Buôn /g;

// ============ SLUG PATTERN ============

// Convert to slug
const SLUG_NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const SLUG_TRIM_PATTERN = /^-+|-+$/g;

// ============ HELPER FUNCTIONS ============

/**
 * Remove all non-digit characters
 */
function removeNonDigits(str) {
  return str.replace(NON_DIGIT_PATTERN, '');
}

/**
 * Remove all non-numeric characters (keep dots)
 */
function removeNonNumeric(str) {
  return str.replace(NON_NUMERIC_PATTERN, '');
}

/**
 * Remove dots
 */
function removeDots(str) {
  return str.replace(DOT_PATTERN, '');
}

/**
 * Remove commas
 */
function removeCommas(str) {
  return str.replace(COMMA_PATTERN, '');
}

/**
 * Format number with thousands separator
 */
function formatThousands(str) {
  return str.replace(THOUSANDS_PATTERN, ',');
}

/**
 * Clean multiple spaces to single space
 */
function cleanSpaces(str) {
  return str.replace(MULTIPLE_SPACES_PATTERN, ' ');
}

/**
 * Convert forward slashes to backslashes
 */
function toBackslash(str) {
  return str.replace(FORWARD_SLASH_PATTERN, '\\');
}

/**
 * Create safe ID for HTML elements
 */
function toSafeId(str) {
  return str.replace(SAFE_ID_PATTERN, '_');
}

/**
 * Convert to slug
 */
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(SLUG_NON_ALPHANUMERIC_PATTERN, '-')
    .replace(SLUG_TRIM_PATTERN, '');
}

/**
 * Remove address prefixes
 */
function cleanAddressPrefix(str) {
  return str
    .replace(ADDRESS_PREFIX_T_PATTERN, '')
    .replace(ADDRESS_PREFIX_TP_PATTERN, '')
    .replace(ADDRESS_PREFIX_H_PATTERN, '')
    .replace(ADDRESS_PREFIX_Q_PATTERN, '')
    .replace(ADDRESS_PREFIX_TX_PATTERN, '')
    .replace(ADDRESS_PREFIX_XA_PATTERN, '')
    .replace(ADDRESS_PREFIX_PHUONG_PATTERN, '')
    .replace(ADDRESS_PREFIX_TT_PATTERN, '')
    .replace(ADDRESS_PREFIX_THON_PATTERN, '')
    .replace(ADDRESS_PREFIX_BUON_PATTERN, '');
}

// ============ EXPORTS ============

if (typeof window !== 'undefined') {
  window.REGEX = {
    // Validation
    CCCD_PATTERN,
    PHONE_PATTERN,
    MST_PATTERN,
    
    // Extraction
    LAND_CODE_PATTERN,
    LAND_CODE_AREA_PATTERN,
    AREA_LAND_CODE_PATTERN,
    LAND_CODE_ONLY_PATTERN,
    LAND_DETAIL_CODE_AREA_PATTERN,
    LAND_DETAIL_AREA_CODE_PATTERN,
    NAME_NUMBER_PATTERN,
    
    // Cleaning
    NON_DIGIT_PATTERN,
    NON_NUMERIC_PATTERN,
    DOT_PATTERN,
    COMMA_PATTERN,
    SAFE_ID_PATTERN,
    
    // Formatting
    THOUSANDS_PATTERN,
    MULTIPLE_SPACES_PATTERN,
    FORWARD_SLASH_PATTERN,
    M2_SUFFIX_PATTERN,
    
    // Address
    ADDRESS_PREFIX_T_PATTERN,
    ADDRESS_PREFIX_TP_PATTERN,
    ADDRESS_PREFIX_H_PATTERN,
    ADDRESS_PREFIX_Q_PATTERN,
    ADDRESS_PREFIX_TX_PATTERN,
    ADDRESS_PREFIX_XA_PATTERN,
    ADDRESS_PREFIX_PHUONG_PATTERN,
    ADDRESS_PREFIX_TT_PATTERN,
    ADDRESS_PREFIX_THON_PATTERN,
    ADDRESS_PREFIX_BUON_PATTERN,
    
    // Slug
    SLUG_NON_ALPHANUMERIC_PATTERN,
    SLUG_TRIM_PATTERN
  };
  
  window.REGEX_HELPERS = {
    removeNonDigits,
    removeNonNumeric,
    removeDots,
    removeCommas,
    formatThousands,
    cleanSpaces,
    toBackslash,
    toSafeId,
    toSlug,
    cleanAddressPrefix
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    REGEX: {
      CCCD_PATTERN,
      PHONE_PATTERN,
      MST_PATTERN,
      LAND_CODE_PATTERN,
      LAND_CODE_AREA_PATTERN,
      AREA_LAND_CODE_PATTERN,
      LAND_CODE_ONLY_PATTERN,
      LAND_DETAIL_CODE_AREA_PATTERN,
      LAND_DETAIL_AREA_CODE_PATTERN,
      NAME_NUMBER_PATTERN,
      NON_DIGIT_PATTERN,
      NON_NUMERIC_PATTERN,
      DOT_PATTERN,
      COMMA_PATTERN,
      SAFE_ID_PATTERN,
      THOUSANDS_PATTERN,
      MULTIPLE_SPACES_PATTERN,
      FORWARD_SLASH_PATTERN,
      M2_SUFFIX_PATTERN,
      ADDRESS_PREFIX_T_PATTERN,
      ADDRESS_PREFIX_TP_PATTERN,
      ADDRESS_PREFIX_H_PATTERN,
      ADDRESS_PREFIX_Q_PATTERN,
      ADDRESS_PREFIX_TX_PATTERN,
      ADDRESS_PREFIX_XA_PATTERN,
      ADDRESS_PREFIX_PHUONG_PATTERN,
      ADDRESS_PREFIX_TT_PATTERN,
      ADDRESS_PREFIX_THON_PATTERN,
      ADDRESS_PREFIX_BUON_PATTERN,
      SLUG_NON_ALPHANUMERIC_PATTERN,
      SLUG_TRIM_PATTERN
    },
    REGEX_HELPERS: {
      removeNonDigits,
      removeNonNumeric,
      removeDots,
      removeCommas,
      formatThousands,
      cleanSpaces,
      toBackslash,
      toSafeId,
      toSlug,
      cleanAddressPrefix
    }
  };
}
