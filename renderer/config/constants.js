
const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;
const PLACEHOLDER_PATTERN = /^([A-Za-z_]+?)(\d+)?$/;
const VALID_PLACEHOLDER_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;


const MAX_PLACEHOLDER_MERGE_ITERATIONS = 10;
const MAX_TEXT_MERGE_ITERATIONS = 5;
const LARGE_FILE_THRESHOLD_MB = 10;


const SAX_PARSER_OPTIONS = {
  trim: false,
  normalize: false,
  lowercase: false
};


const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  ADDRESS_SELECT: 'address-select',
  LAND_TYPE: 'land_type',
  LAND_TYPE_SIZE: 'land_type_size',
  LAND_TYPE_DETAIL: 'land_type_detail',
  CURRENCY: 'currency',
  TEL: 'tel',
  EMAIL: 'email',
  TEXT_OR_DOTS: 'text-or-dots'
};

const DEFAULT_DOT_PLACEHOLDER = '...........';
const DEFAULT_GENDER_OPTIONS = ['Ông', 'Bà'];

const MIN_TEMPLATE_NAME_LENGTH = 3;
const MAX_TEMPLATE_NAME_LENGTH = 100;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PLACEHOLDER_REGEX,
    PLACEHOLDER_PATTERN,
    VALID_PLACEHOLDER_NAME,
    MAX_PLACEHOLDER_MERGE_ITERATIONS,
    MAX_TEXT_MERGE_ITERATIONS,
    LARGE_FILE_THRESHOLD_MB,
    SAX_PARSER_OPTIONS,
    FIELD_TYPES,
    DEFAULT_DOT_PLACEHOLDER,
    DEFAULT_GENDER_OPTIONS,
    MIN_TEMPLATE_NAME_LENGTH,
    MAX_TEMPLATE_NAME_LENGTH
  };
}

if (typeof window !== 'undefined') {
  window.Constants = {
    PLACEHOLDER_REGEX,
    PLACEHOLDER_PATTERN,
    VALID_PLACEHOLDER_NAME,
    MAX_PLACEHOLDER_MERGE_ITERATIONS,
    MAX_TEXT_MERGE_ITERATIONS,
    LARGE_FILE_THRESHOLD_MB,
    SAX_PARSER_OPTIONS,
    FIELD_TYPES,
    DEFAULT_DOT_PLACEHOLDER,
    DEFAULT_GENDER_OPTIONS,
    MIN_TEMPLATE_NAME_LENGTH,
    MAX_TEMPLATE_NAME_LENGTH
  };
}
