import fs from 'fs'
import yaml from 'js-yaml'

import {
    BRACKET_MAP, NTING_LEFT, NTING_RIGHT, SECTION_REGEXP, TING_LEFT, TING_RIGHT, TYPE_NTING,
    TYPE_TING, YAML_LEFT, YAML_REGEXP, YAML_RIGHT
} from '../constants'

class Section {
  // # Type: 'nting' | 'ting'
  // ## nting: non-translating brackets
  // 1. all Ntings are linked, if one was deleted, others would be deleted too
  // 2. all Ntings' inner texts are linked
  // ## ting: translating brackets
  // 1. all Tings are linked, if one was deleted, others would be deleted too
  // 2. Inner text is translatable
  type: string
  innerText: string
}

export default class LangTextModel {
  text: string

  constructor( text: string ) {
    this.text = text
  }

  get sections(): Section[] {
    let res: Section[] = []

    let type: string
    // counting state
    // 0: searching for a left bracket
    // 1: searching for a right bracket
    let state: number = 0
    let innerText = ""
    this.text.split( "" ).forEach( ( char, charIndex ) => {
      const hasStartedMatch = type != null
      if ( hasStartedMatch ) {
        innerText = innerText + char
      }

      const match = (
        matchingType: string,
        leftBracket: string,
        rightBracket: string
      ) => {
        const matchedBracket = bracket => {
          return bracket.split( "" ).every( ( item, itemIndex ) => {
            return (
              this.text[ charIndex - ( bracket.length - 1 ) + itemIndex ] === item
            )
          } )
        }

        if ( matchedBracket( leftBracket ) ) {
          if ( type == null ) {
            innerText = BRACKET_MAP[ matchingType ].LEFT
            type = matchingType
            state = 1
          }
        }
        if ( matchedBracket( rightBracket ) ) {
          if ( type === matchingType ) {
            const text =
              type === TYPE_NTING ?
                sectionOuterTextToInnerText( matchingType, innerText ) :
                ""
            const section: Section = {
              type,
              innerText: text
            }
            res.push( section )
            state = 0
            type = null
            innerText = ""
          }
        }
      }

      match( TYPE_NTING, NTING_LEFT, NTING_RIGHT )
      match( TYPE_TING, TING_LEFT, TING_RIGHT )
    } )
    return res
  }

  get yamlOuterText(): string {
    const { text } = this
    const potentialOuterText = text.match( YAML_REGEXP ) ?
      text.match( YAML_REGEXP )[ 0 ] :
      ""
    return potentialOuterText != null ? potentialOuterText : ""
  }

  get varMap(): any {
    const yamlText = getYamlText( this.yamlOuterText )
    if ( yamlText.length > 0 ) {
      const data = yaml.safeLoad( yamlText )
      if ( data != null ) {
        return data
      }
    }
    return {}
  }

  // add section by referring section
  addSection( referringSection: Section, referringSectionIndex: number ) {
    const prevSectionIndex = referringSectionIndex - 1

    // # look for previous section by target section index
    // ## if not, add section to the end of text
    // ## if exists, add section after previous section
    const prevSection = this.sections[ prevSectionIndex ]
    const referringSectionString = sectionToString( referringSection )

    if ( prevSection == null ) {
      this.text = `${this.text}${referringSectionString}`
    }
    if ( prevSection != null ) {
      let replacerIndex = -1
      this.text = this.text.replace( SECTION_REGEXP, matched => {
        replacerIndex++
        if ( prevSectionIndex === replacerIndex ) {
          return `${matched}${referringSectionString}`
        }
        return matched
      } )
    }
  }

  updateSection( referringSection: Section, referringSectionIndex: number ) {
    const currentSection = this.sections[ referringSectionIndex ]
    const { type: currentType } = currentSection
    const { type: referringType } = referringSection

    const updateSectionByContent = (
      referringSectionIndex: number,
      toReplace: string
    ) => {
      let replacerIndex = -1
      this.text = this.text.replace( SECTION_REGEXP, matched => {
        replacerIndex++
        if ( referringSectionIndex === replacerIndex ) {
          return toReplace
        }
        return matched
      } )
    }

    if ( referringType === TYPE_NTING ) {
      // update section's inner text
      const toReplace = getSectionOuterText( referringSection )
      return updateSectionByContent( referringSectionIndex, toReplace )
    }
    if ( referringType === TYPE_TING && currentType === TYPE_NTING ) {
      const toReplace = `${TING_LEFT}${TING_RIGHT}`
      return updateSectionByContent( referringSectionIndex, toReplace )
    }
  }

  // update nting section by referring nting section
  updateNtingSection( referringSection: Section, referringSectionIndex: number ) {
    let replacerIndex = -1
    this.text = this.text.replace( SECTION_REGEXP, matched => {
      replacerIndex++
      if ( referringSectionIndex === replacerIndex ) {
        const outerText = getSectionOuterText( referringSection )
        return `${outerText}`
      }
      return matched
    } )
  }

  removeSectionByIndices( extraIndices: number[] ) {
    let replacerIndex = -1
    this.text = this.text.replace( SECTION_REGEXP, matched => {
      replacerIndex++
      if ( extraIndices.includes( replacerIndex ) ) {
        return ``
      }
      return matched
    } )
  }

  // # variable
  updateYaml( referring: LangTextModel ) {
    const { yamlOuterText } = referring
    const isExisting = YAML_REGEXP.test( this.text )
    if ( !isExisting ) {
      this.text = `${yamlOuterText}
${this.text}`
      return
    }
    this.text = this.text.replace( YAML_REGEXP, yamlOuterText )
  }
}

export function getLangTextInfo( file: string ) {
  const text = fs.readFileSync( file, { encoding: "utf8" } )
  const langTextInfo = new LangTextModel( text )
  return langTextInfo
}

export function sectionToString( section: Section ) {
  const { type, innerText } = section
  const { LEFT, RIGHT } = BRACKET_MAP[ type ]
  return `${LEFT}${innerText}${RIGHT}`
}

export function getSectionOuterText( section: Section ) {
  const { type, innerText } = section
  const { LEFT, RIGHT } = BRACKET_MAP[ type ]
  return `${LEFT}${innerText}${RIGHT}`
}

export function sectionOuterTextToInnerText( type: string, outerText: string ) {
  const { LEFT, RIGHT } = BRACKET_MAP[ type ]
  return outerText
    .replace( new RegExp( `^\\${LEFT}`, "m" ), "" )
    .replace( new RegExp( `\\${RIGHT}$`, "m" ), "" )
}

function getYamlText( outerText: string ) {
  return outerText
    .replace( new RegExp( `^${YAML_LEFT}` ), "" )
    .replace( new RegExp( `${YAML_RIGHT}$` ), "" )
    .trim()
}
