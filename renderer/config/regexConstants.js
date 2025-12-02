const CCCD_PATTERN = /^\d{9}$|^\d{12}$/;
const PHONE_PATTERN = /^\d{10}$/;
const MST_PATTERN = /^\d{10}$|^\d{13}$/;
const LAND_CODE_PATTERN = /^([A-Z]+)/i;
const LAND_CODE_AREA_PATTERN = /^([A-Z]+)\s+(\d+(?:\.\d+)?)/i;
const AREA_LAND_CODE_PATTERN = /^(\d+(?:\.\d+)?)\s*m2?\s+([A-Z]+)/i;
const LAND_CODE_ONLY_PATTERN = /^([A-Z]+)$/i;
const LAND_DETAIL_CODE_AREA_PATTERN = /^([A-Z]+)\s+(\d+(?:\.\d+)?)\s*m2?$/i;
const LAND_DETAIL_AREA_CODE_PATTERN = /^(\d+(?:\.\d+)?)\s*m2?\s*([A-Z]+)$/i;
const NAME_NUMBER_PATTERN = /^Name(\d+)$/;
const NON_DIGIT_PATTERN = /\D/g;
const NON_NUMERIC_PATTERN = /[^\d.]/g;
const DOT_PATTERN = /\./g;
const COMMA_PATTERN = /,/g;
const SAFE_ID_PATTERN = /[^a-zA-Z0-9-_]/g;
const THOUSANDS_PATTERN = /\B(?=(\d{3})+(?!\d))/g;
const MULTIPLE_SPACES_PATTERN = / +/g;
const FORWARD_SLASH_PATTERN = /\//g;
const M2_SUFFIX_PATTERN = /m2/g;

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

const SLUG_NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const SLUG_TRIM_PATTERN = /^-+|-+$/g;

function removeNonDigits(str) {
  return str.replace(NON_DIGIT_PATTERN, '');
}


function removeNonNumeric(str) {
  return str.replace(NON_NUMERIC_PATTERN, '');
}


function removeDots(str) {
  return str.replace(DOT_PATTERN, '');
}

function removeCommas(str) {
  return str.replace(COMMA_PATTERN, '');
}

function formatThousands(str) {
  return str.replace(THOUSANDS_PATTERN, ',');
}

function cleanSpaces(str) {
  return str.replace(MULTIPLE_SPACES_PATTERN, ' ');
}

function toBackslash(str) {
  return str.replace(FORWARD_SLASH_PATTERN, '\\');
}

function toSafeId(str) {
  return str.replace(SAFE_ID_PATTERN, '_');
}

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(SLUG_NON_ALPHANUMERIC_PATTERN, '-')
    .replace(SLUG_TRIM_PATTERN, '');
}

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

if (typeof window !== 'undefined') {
  window.REGEX = {
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
