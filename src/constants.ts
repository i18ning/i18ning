// # nting
export const TYPE_NTING = "nting"
export const NTING_LEFT = `[`
export const NTING_RIGHT = `]`

// # ting
export const TYPE_TING = "ting"
export const TING_LEFT = "{"
export const TING_RIGHT = "}"

// # section
export const SECTION_REGEXP = new RegExp(
  `\\${NTING_LEFT}[\\s\\S]*?\\${NTING_RIGHT}|\\${TING_LEFT}[\\s\\S]*?\\${TING_RIGHT}`,
  "gm"
)

export const VAR_LEFT = "<"
export const VAR_RIGHT = ">"

export const BRACKET_MAP = {
  [ TYPE_NTING ]: {
    LEFT : NTING_LEFT,
    RIGHT: NTING_RIGHT
  },
  [ TYPE_TING ]: {
    LEFT : TING_LEFT,
    RIGHT: TING_RIGHT
  }
}
