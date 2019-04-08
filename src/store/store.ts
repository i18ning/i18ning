import fs from 'fs'

import LangTextModel from '../models/LangTextModel'
import { Config } from '../sync'

export function getLangTextInfo(
  file: string,
  config: {
    isRoot?: boolean
    placeholder?: string
    syncConfig?: Config
  } = {}
) {
  const { isRoot, placeholder, syncConfig = {} } = config
  const text = fs.readFileSync( file, { encoding: "utf8" } )
  const langTextInfo = new LangTextModel(
    text, {
      isRoot,
      placeholder,
      enableTranslation: syncConfig.enableTranslation
    }
  )
  return langTextInfo
}
