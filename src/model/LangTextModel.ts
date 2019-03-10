import fs from 'fs'
import yaml from 'js-yaml'

import {
    BRACKET_MAP, NTING_LEFT, NTING_RIGHT, SECTION_REGEXP, TING_LEFT, TING_RIGHT, TYPE_NTING,
    TYPE_TING, VAR_LEFT, VAR_REGEXP, VAR_RIGHT, YAML_LEFT, YAML_REGEXP, YAML_RIGHT
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
  // innerSections: Section[]
}

export default class LangTextModel {
  text: string
  workspaceType: string

  constructor( text: string, workspaceType: string ) {
    this.text = text
    this.workspaceType = workspaceType
  }

  updateByReferring( referring: LangTextModel ) {
    if (
      this.workspaceType === TYPE_TING &&
      referring.workspaceType === TYPE_TING
    ) {
      // # update sections
      // ## check if every section exist
      // // ### if not, create from referring section
      // // ### if exists and referring section's type is nting, update its inner text
      referring.sections.forEach( ( referringSection, index ) => {
        const currentSection = this.sections[ index ]
        if ( currentSection == null ) {
          // add section
          this.addSection( referringSection, index )
        }
        if ( currentSection != null ) {
          this.updateSectionByReferringSection( referringSection, index )
        }
      } )
      // # remove extra sections in target
      let extraIndices = []
      for (
        let i = referring.sections.length;
        i <= this.sections.length - 1;
        i++
      ) {
        extraIndices.push( i )
      }
      this.removeSectionByIndices( extraIndices )
      return
    }
    if (
      this.workspaceType === TYPE_NTING &&
      referring.workspaceType === TYPE_NTING
    ) {
      const cloned = new LangTextModel( referring.text, referring.workspaceType )

      cloned.sections.forEach( ( clonedSection, index ) => {
        const currentSection = this.sections[ index ]

        if ( currentSection != null ) {
          cloned.updateSectionByOriginalSection( currentSection, index )
        }
      } )

      this.text = cloned.text
    }
  }

  // # Section

  get sections(): Section[] {
    return matchToGetSections( [ TYPE_NTING, TYPE_TING ], this.text )
  }

  // add section by referring section
  addSection( referringSection: Section, referringSectionIndex: number ) {
    const prevSectionIndex = referringSectionIndex - 1

    // # look for previous section by target section index
    // ## if not, add section to the end of text
    // ## if exists, add section after previous section
    const prevSection = this.sections[ prevSectionIndex ]

    const { innerText: referringInnerText } = referringSection

    // here can transform referring inner text
    const text: string = ( () => {
      return referringInnerText
    } )()

    const referringSectionString = getSectionOuterTextByInnerText(
      referringSection.type,
      text
    )

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

  updateSectionByReferringSection(
    referringSection: Section,
    referringSectionIndex: number
  ) {
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
      const text: string = ( () => {
        // update referring and current objects
        const targetLangTextModel = new LangTextModel(
          currentSection.innerText,
          this.workspaceType
        )
        const tmpLangModel = new LangTextModel(
          referringSection.innerText,
          TYPE_NTING
        )

        targetLangTextModel.sections.forEach( ( targetSection, targetIndex ) => {
          // # update sections
          const tmpSection = tmpLangModel.sections[ targetIndex ]
          if ( tmpSection != null ) {
            let replacerIndex = -1
            tmpLangModel.text = tmpLangModel.text.replace(
              SECTION_REGEXP,
              matched => {
                replacerIndex++
                if ( replacerIndex === targetIndex ) {
                  return `${TING_LEFT}${targetSection.innerText}${TING_RIGHT}`
                }
                return matched
              }
            )
          }
        } )
        return tmpLangModel.text
      } )()
      const toReplace = getSectionOuterTextByInnerText(
        referringSection.type,
        text
      )
      return updateSectionByContent( referringSectionIndex, toReplace )
    }
    if ( referringType === TYPE_TING && currentType === TYPE_NTING ) {
      const toReplace = `${TING_LEFT}${TING_RIGHT}`
      return updateSectionByContent( referringSectionIndex, toReplace )
    }
    if ( referringType === TYPE_TING && currentType === TYPE_TING ) {
    }
  }

  updateSectionByOriginalSection(
    originalSection: Section,
    orgianlSectionIndex: number
  ) {
    const updateSectionByContent = ( index: number, replacingText: string ) => {
      let replacerIndex = -1
      this.text = this.text.replace( SECTION_REGEXP, matched => {
        replacerIndex++
        if ( index === replacerIndex ) {
          return replacingText
        }
        return matched
      } )
    }

    const currentSection = this.sections[ orgianlSectionIndex ]
    if (
      ( originalSection.type === TYPE_NTING &&
        currentSection.type === TYPE_NTING ) ||
      ( originalSection.type === TYPE_TING && currentSection.type === TYPE_NTING )
    ) {
      const replacingText = getSectionOuterText( currentSection )
      updateSectionByContent( orgianlSectionIndex, replacingText )
    }
    if (
      originalSection.type === TYPE_NTING &&
      currentSection.type === TYPE_TING
    ) {
      const replacingText = getSectionOuterText( currentSection )
      updateSectionByContent( orgianlSectionIndex, replacingText )
    }
    if (
      originalSection.type === TYPE_TING &&
      currentSection.type === TYPE_TING
    ) {
      const replacingText = getSectionOuterText( originalSection )
      updateSectionByContent( orgianlSectionIndex, replacingText )
    }
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

  updateYaml( referring: LangTextModel ) {
    const { yamlOuterText } = referring
    const isExisting = YAML_REGEXP.test( this.text )
    if ( !isExisting && yamlOuterText !== "" ) {
      this.text = `${yamlOuterText}${this.text}`
      return
    }
    this.text = this.text.replace( YAML_REGEXP, yamlOuterText )
  }

  // # Convert
  get convertedText(): string {
    return this.text
      .replace( SECTION_REGEXP, outerText => {
        return outerText
          .replace( new RegExp( `^\\${NTING_LEFT}`, "m" ), "" )
          .replace( new RegExp( `\\${NTING_RIGHT}$`, "m" ), "" )
          .replace( new RegExp( `^\\${TING_LEFT}`, "m" ), "" )
          .replace( new RegExp( `\\${TING_RIGHT}$`, "m" ), "" )
      } )
      .replace( YAML_REGEXP, "" )
      .replace( VAR_REGEXP, outerText => {
        const key = outerText
          .replace( new RegExp( `^\\${VAR_LEFT}` ), "" )
          .replace( new RegExp( `\\${VAR_RIGHT}$` ), "" )
        const str = this.varMap[ key ]
        return str != null ? str : ""
      } )
  }
}

export function getLangTextInfo( file: string, workSpaceType: string ) {
  const text = fs.readFileSync( file, { encoding: "utf8" } )
  const langTextInfo = new LangTextModel( text, workSpaceType )
  return langTextInfo
}
// # section
export function getSectionOuterText( section: Section ) {
  const { type, innerText } = section
  return getSectionOuterTextByInnerText( type, innerText )
}

export function getSectionOuterTextByInnerText(
  type: string,
  innerText: string
) {
  const { LEFT, RIGHT } = BRACKET_MAP[ type ]
  return `${LEFT}${innerText}${RIGHT}`
}

export function sectionOuterTextToInnerText( type: string, outerText: string ) {
  const { LEFT, RIGHT } = BRACKET_MAP[ type ]
  return outerText
    .replace( new RegExp( `^\\${LEFT}`, "m" ), "" )
    .replace( new RegExp( `\\${RIGHT}$`, "m" ), "" )
}

function getInnerSections( type: string, innerText: string ) {
  let res: Section[] = []
  let targetType: string
  if ( type === TYPE_NTING ) {
    targetType = TYPE_TING
  }
  if ( type === TYPE_TING ) {
    targetType = TYPE_NTING
  }

  targetType != null && matchToGetSections( [ targetType ], innerText )
  return res
}

// contracted method, used in multiple places
function matchToGetSections( types: string[], targetText: string ) {
  let res: Section[] = []

  let currentType: string
  // counting state
  // 0: searching for a left bracket
  // 1: searching for a right bracket
  let state: number = 0
  let innerText = ""
  targetText.split( "" ).forEach( ( char, charIndex ) => {
    const hasStartedMatch = currentType != null
    if ( hasStartedMatch ) {
      innerText = innerText + char
    }

    const match = ( matchingType: string ) => {
      const leftBracket = BRACKET_MAP[ matchingType ].LEFT
      const rightBracket = BRACKET_MAP[ matchingType ].RIGHT
      const matchedBracket = bracket => {
        return bracket.split( "" ).every( ( item, itemIndex ) => {
          return (
            targetText[ charIndex - ( bracket.length - 1 ) + itemIndex ] === item
          )
        } )
      }

      if ( matchedBracket( leftBracket ) ) {
        if ( currentType == null ) {
          innerText = BRACKET_MAP[ matchingType ].LEFT
          currentType = matchingType
          state = 1
        }
      }
      if ( matchedBracket( rightBracket ) ) {
        if ( currentType === matchingType ) {
          const text = sectionOuterTextToInnerText( matchingType, innerText )
          // const innerSections = getInnerSections( currentType, text )
          const section: Section = {
            type     : currentType,
            innerText: text
            // innerSections
          }
          res.push( section )
          state = 0
          currentType = null
          innerText = ""
        }
      }
    }

    types.map( match )
  } )
  return res
}

// # variable
function getYamlText( outerText: string ) {
  return outerText
    .replace( new RegExp( `^${YAML_LEFT}` ), "" )
    .replace( new RegExp( `${YAML_RIGHT}\n$`, "m" ), "" )
    .trim()
}
