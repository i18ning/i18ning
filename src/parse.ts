import { TYPE_NTING } from './constants'
import TextModel from './models/TextModel'

export default function parse( text: string ) {
  const langTextModel = new TextModel( text )
  const { convertedText, varMap } = langTextModel
  return {
    yaml: varMap,
    text: convertedText
  }
}
