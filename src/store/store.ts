import fs from 'fs'

import LangTextModel from '../models/LangTextModel'
import { Config } from '../sync'

export function getLangTextInfo(
  file: string,
  config: {
    workSpaceType?: string
    isRoot?: boolean
    placeholder?: string
    syncConfig?: Config
  } = {}
) {
  const { workSpaceType, isRoot, placeholder, syncConfig = {} } = config
  const text = fs.readFileSync( file, { encoding: "utf8" } )
  const langTextInfo = new LangTextModel(
    text,
    workSpaceType,
    isRoot,
    placeholder,
    syncConfig
  )
  return langTextInfo
}
