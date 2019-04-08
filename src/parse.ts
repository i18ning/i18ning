import { TYPE_NTING } from './constants'
import LangTextModel from './models/LangTextModel'

export default function parse( text: string ) {
  const langTextModel = new LangTextModel( text )
  const { convertedText, varMap } = langTextModel
  return {
    yaml: varMap,
    text: convertedText
  }
}
