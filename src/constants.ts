// Section inner text regexp's text format
const ID_REGEXP_TEXT = `(\\d+|\\@{0,1}\\S*?)`
const INNER_TEXT_REGEXP = "([\\s\\S]*?)"

// # nting
export const TYPE_NTING = "nting"

export const NTING_LEFT_PREFIX = `[[`
export const NTING_LEFT_POSTFIX = `]]`
export const NTING_LEFT_REGEXP_TEXT =
  NTING_LEFT_PREFIX + ID_REGEXP_TEXT + NTING_LEFT_POSTFIX

export const NTING_RIGHT_PREFIX = `[[/`
export const NTING_RIGHT_POSTFIX = `]]`
export const NTING_RIGHT_REGEXP_TEXT =
  NTING_RIGHT_PREFIX + ID_REGEXP_TEXT + NTING_RIGHT_POSTFIX

export const NTING_REGEXP_TEXT =
  NTING_LEFT_REGEXP_TEXT +
  INNER_TEXT_REGEXP +
  NTING_RIGHT_PREFIX +
  "\\1" +
  NTING_RIGHT_POSTFIX

// # ting
export const TYPE_TING = "ting"

export const TING_LEFT_PREFIX = `<`
export const TING_LEFT_POSTFIX = `>`
export const TING_LEFT_REGEXP_TEXT =
  TING_LEFT_PREFIX + ID_REGEXP_TEXT + TING_LEFT_POSTFIX

export const TING_RIGHT_PREFIX = `</`
export const TING_RIGHT_POSTFIX = `>`
export const TING_RIGHT_REGEXP_TEXT =
  TING_RIGHT_PREFIX + ID_REGEXP_TEXT + TING_RIGHT_POSTFIX

export const TING_REGEXP_TEXT =
  TING_LEFT_REGEXP_TEXT +
  INNER_TEXT_REGEXP +
  TING_RIGHT_PREFIX +
  "\\1" +
  TING_RIGHT_POSTFIX

// ## tag used to generate ting automatically
export const TYPE_PLACEHOLDER_TING = "placeholder-ting"
export const PLACEHOLDER_TING_REGEXP_TEXT = "<@>"

// # section
export const SECTION_REGEXP = new RegExp(
  NTING_REGEXP_TEXT +
    "|" +
    TING_LEFT_REGEXP_TEXT +
    INNER_TEXT_REGEXP +
    TING_RIGHT_PREFIX +
    "\\2" +
    TING_RIGHT_POSTFIX,
  "gm"
)

export class TYPE_SECTION_MAP_ITEM {
  LEFT_PREFIX: string
  LEFT_POSTFIX: string
  RIGHT_PREFIX: string
  RIGHT_POSTFIX: string

  LEFT_REGEXP_TEXT: string
  RIGHT_REGEXP_TEXT: string

  REGEXP_TEXT: string
}

class TYPE_SECTION_MAP {
  [TYPE_NTING]: TYPE_SECTION_MAP_ITEM;
  [TYPE_TING]: TYPE_SECTION_MAP_ITEM
}

export const SECTION_MAP: TYPE_SECTION_MAP = {
  [ TYPE_NTING ]: {
    LEFT_PREFIX  : NTING_LEFT_PREFIX,
    LEFT_POSTFIX : NTING_LEFT_POSTFIX,
    RIGHT_PREFIX : NTING_RIGHT_PREFIX,
    RIGHT_POSTFIX: NTING_RIGHT_POSTFIX,

    LEFT_REGEXP_TEXT : NTING_LEFT_REGEXP_TEXT,
    RIGHT_REGEXP_TEXT: NTING_RIGHT_REGEXP_TEXT,

    REGEXP_TEXT: NTING_REGEXP_TEXT
  },
  [ TYPE_TING ]: {
    LEFT_PREFIX  : TING_LEFT_PREFIX,
    LEFT_POSTFIX : TING_LEFT_POSTFIX,
    RIGHT_PREFIX : TING_RIGHT_PREFIX,
    RIGHT_POSTFIX: TING_RIGHT_POSTFIX,

    LEFT_REGEXP_TEXT : TING_LEFT_REGEXP_TEXT,
    RIGHT_REGEXP_TEXT: TING_RIGHT_REGEXP_TEXT,

    REGEXP_TEXT: TING_REGEXP_TEXT
  }
}

// can be used to justify priority of two type
// while matching to get sections
export const TYPES = [ TYPE_TING, TYPE_NTING ]

// # variable
export const YAML_LEFT = "---i18n"
export const YAML_RIGHT = "---"
export const YAML_REGEXP = new RegExp(
  `${YAML_LEFT}[\\s\\S]*?${YAML_RIGHT}\\n`,
  "m"
)
export const VAR_LEFT = "<@"
export const VAR_RIGHT = "/>"
export const VAR_REGEXP = new RegExp( `\\${VAR_LEFT}\\S*?\\${VAR_RIGHT}`, "g" )
