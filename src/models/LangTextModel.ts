import yaml from 'js-yaml'

import {
    INNER_TEXT_REGEXP_TEXT, NO_PRECEDING_BLACKSPLASH_REGEXP_TEXT, NTING_LEFT_REGEXP_TEXT,
    NTING_RIGHT_REGEXP_TEXT, PLACEHOLDER_TING_REGEXP_TEXT, SECTION_MAP, SECTION_REGEXP,
    TING_LEFT_POSTFIX, TING_LEFT_PREFIX, TING_LEFT_REGEXP_TEXT, TING_RIGHT_POSTFIX,
    TING_RIGHT_PREFIX, TING_RIGHT_REGEXP_TEXT, TYPE_NTING, TYPE_SECTION_MAP_ITEM, TYPE_TING, TYPES,
    VAR_LEFT, VAR_REGEXP, VAR_RIGHT, YAML_LEFT, YAML_REGEXP, YAML_RIGHT
} from '../constants'

export class Section {
  // # Type: 'nting' | 'ting'
  // ## nting: non-translating brackets
  // 1. all Ntings are linked, if one was deleted, others would be deleted too
  // 2. all Ntings' inner texts are linked
  // ## ting: translating brackets
  // 1. all Tings are linked, if one was deleted, others would be deleted too
  // 2. Inner text is translatable
  type: string
  id: string
  outerText: string
  innerText: string

  constructor( type: string, id: string, outerText: string, innerText: string ) {
    this.type = type
    this.id = id
    this.outerText = outerText
    this.innerText = innerText
  }

  get left(): string {
    const { LEFT_REGEXP_TEXT }: TYPE_SECTION_MAP_ITEM = SECTION_MAP[ this.type ]

    const r = new RegExp( "^" + LEFT_REGEXP_TEXT )
    const matched = this.outerText.match( r ) || []

    return matched[ 0 ]
  }

  get right(): string {
    const { RIGHT_REGEXP_TEXT }: TYPE_SECTION_MAP_ITEM = SECTION_MAP[ this.type ]

    const r = new RegExp( RIGHT_REGEXP_TEXT + "$" )
    const matched = this.outerText.match( r ) || []

    return matched[ 0 ]
  }

  updateInnerText( innerText: string ) {
    this.innerText = innerText
    const { left, right } = this
    this.outerText = `${left}${innerText}${right}`
  }
}

export class PlaceholderSection {
  outerText: string
  innerText: string
  constructor( outerText: string, innerText: string ) {
    this.outerText = outerText
    this.innerText = innerText
  }
}

export default class LangTextModel {
  text: string
  workspaceType: string
  isRoot: boolean = false
  placeholder: string = PLACEHOLDER_TING_REGEXP_TEXT

  constructor(
    text: string,
    workspaceType: string = TYPE_NTING,
    isRoot: boolean = false,
    placeholder?: string
  ) {
    this.text = text
    this.workspaceType = workspaceType
    this.isRoot = isRoot
    if ( placeholder != null ) {
      this.placeholder = placeholder
    }
  }

  updateByReferring( referring: LangTextModel, translateFn: Function ) {
    // # confirmd: types are both nting
    const clonedReferring = new LangTextModel(
      referring.text,
      referring.workspaceType
    )

    let resolved = false
    const maxWaitTime = 60000

    clonedReferring
      .updateByOriginalSections( this.sections, translateFn )
      .then( () => {
        resolved = true
      } )

    return new Promise( ( resolve, reject ) => {
      let timer = setInterval( () => {
        if ( resolved ) {
          clearInterval( timer )
          this.text = clonedReferring.text
          resolve()
        }
      }, 1000 )

      setTimeout( () => {
        clearInterval( timer )
        reject()
      }, maxWaitTime )
    } )
  }

  // # section
  get sections(): Section[] {
    return matchToGetSections( TYPES, this.text )
  }

  async updateByOriginalSections(
    originalSections: Section[],
    translate: Function
  ) {
    const updateText = ( index: number, replacingText: string ) => {
      let replacerIndex = -1
      this.text = this.text.replace( SECTION_REGEXP, matched => {
        replacerIndex++
        if ( index === replacerIndex ) {
          return replacingText
        }
        return matched
      } )
    }

    let index = -1
    for ( const currentSection of this.sections ) {
      index++

      const foundIndex = originalSections
        .map( ( { id } ) => id )
        .indexOf( currentSection.id )

      if ( foundIndex === -1 ) {
        // translate it
        if ( currentSection.innerText.trim() !== "" ) {
          const translatedInnerText = await translate( currentSection.innerText )
          currentSection.updateInnerText( translatedInnerText )
        }
        const replacingText = currentSection.outerText
        updateText( index, replacingText )
      }

      if ( foundIndex > -1 ) {
        const originalSection = originalSections[ foundIndex ]
        const typeA = currentSection.type
        const typeB = originalSection.type

        if (
          ( typeA === TYPE_NTING && typeB === TYPE_NTING ) ||
          ( typeA === TYPE_NTING && typeB === TYPE_TING )
        ) {
          const replacingText = currentSection.outerText
          updateText( index, replacingText )
        }
        if ( typeA === TYPE_TING && typeB === TYPE_NTING ) {
          const replacingText = currentSection.outerText
          updateText( index, replacingText )
        }
        if ( typeA === TYPE_TING && typeB === TYPE_TING ) {
          const replacingText = originalSection.outerText
          updateText( index, replacingText )
        }
      }
    }
  }

  // # placeholder section
  get placeholderSectionRegexpText(): string {
    const { placeholder } = this
    return (
      NO_PRECEDING_BLACKSPLASH_REGEXP_TEXT +
      placeholder +
      INNER_TEXT_REGEXP_TEXT +
      NO_PRECEDING_BLACKSPLASH_REGEXP_TEXT +
      placeholder
    )
  }
  get placeholderSections(): PlaceholderSection[] {
    const res = matchToGetPlaceholderSections(
      this.placeholderSectionRegexpText,
      this.text
    )
    return res
  }
  get uniqueSectionId(): string {
    const ids = this.sections.map( v => v.id )
    let i = 0
    while ( ids.includes( `${i}` ) ) {
      i++
    }
    return `${i}`
  }
  convertPlaceholderSectionsToSections() {
    const { placeholderSectionRegexpText } = this
    const regexp = new RegExp( placeholderSectionRegexpText )

    this.placeholderSections.forEach( placeholderSection => {
      const { innerText } = placeholderSection
      const { uniqueSectionId } = this
      const replacingText = `${TING_LEFT_PREFIX}${uniqueSectionId}${TING_LEFT_POSTFIX}${innerText}${TING_RIGHT_PREFIX}${uniqueSectionId}${TING_RIGHT_POSTFIX}`
      this.text = this.text.replace( regexp, replacingText )
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
    if ( this.isRoot ) {
      const { yamlOuterText } = referring
      const isExisting = YAML_REGEXP.test( this.text )
      if ( !isExisting && yamlOuterText !== "" ) {
        this.text = `${yamlOuterText}${this.text}`
        return
      }
      this.text = this.text.replace( YAML_REGEXP, yamlOuterText )
    }
  }

  // # Convert
  get convertedText(): string {
    return this.text
      .replace( SECTION_REGEXP, outerText => {
        return outerText
          .replace( new RegExp( "^" + TING_LEFT_REGEXP_TEXT, "m" ), "" )
          .replace( new RegExp( TING_RIGHT_REGEXP_TEXT + "$", "m" ), "" )
      } )
      .replace( YAML_REGEXP, "" )
      .replace( VAR_REGEXP, outerText => {
        const key = outerText
          .replace( new RegExp( `^` + VAR_LEFT ), "" )
          .replace( new RegExp( VAR_RIGHT + `$` ), "" )
        const str = this.varMap[ key ]
        return str != null ? str : ""
      } )
  }
}

// # section
// contracted method, used in multiple places
function matchToGetSections( types: string[], targetText: string ) {
  let res: Section[] = []

  let remainingText = targetText

  while ( remainingText.length > 0 ) {
    let shouldContinuePreviously = false
    const match = ( type: string ) => {
      const { REGEXP_TEXT } = SECTION_MAP[ type ]
      const matched = remainingText.match( new RegExp( REGEXP_TEXT, "m" ) )
      // console.log( remainingText, REGEXP_TEXT )
      if ( matched == null ) {
        return
      }

      const [ outerText, id, innerText ] = matched

      const section = new Section( type, id, outerText, innerText )
      res.push( section )

      const removingRegexp = new RegExp( ".*?" + REGEXP_TEXT, "m" )
      remainingText = remainingText.replace( removingRegexp, "" )
      shouldContinuePreviously = true
    }

    types.map( match )

    if ( shouldContinuePreviously ) {
      continue
    }
    remainingText = remainingText.substring( 1, remainingText.length )
  }

  // console.log( res )
  // console.log( `======` )

  return res
}

// # placeholder section
function matchToGetPlaceholderSections( regexpText, targetText: string ) {
  let res: PlaceholderSection[] = []

  let remainingText = targetText

  while ( remainingText.length > 0 ) {
    let shouldContinuePreviously = false
    const match = () => {
      const matched = remainingText.match( new RegExp( regexpText, "m" ) )
      if ( matched == null ) {
        return
      }

      const [ outerText, innerText ] = matched

      const placeholderSection = new PlaceholderSection( outerText, innerText )
      res.push( placeholderSection )

      const removingRegexp = new RegExp( ".*?" + regexpText, "m" )
      remainingText = remainingText.replace( removingRegexp, "" )
      shouldContinuePreviously = true
    }

    match()

    if ( shouldContinuePreviously ) {
      continue
    }
    remainingText = remainingText.substring( 1, remainingText.length )
  }

  // console.log( res )
  // console.log( `======` )

  return res
}

// # variable
function getYamlText( outerText: string ) {
  return outerText
    .replace( new RegExp( `^${YAML_LEFT}` ), "" )
    .replace( new RegExp( `${YAML_RIGHT}\n$`, "m" ), "" )
    .trim()
}
