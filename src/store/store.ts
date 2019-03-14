import fs from 'fs'

import LangTextModel from '../models/LangTextModel'

export function getLangTextInfo(
  file: string,
  workSpaceType: string,
  isRoot: boolean,
  placeholder: string
) {
  const text = fs.readFileSync( file, { encoding: "utf8" } )
  const langTextInfo = new LangTextModel(
    text,
    workSpaceType,
    isRoot,
    placeholder
  )
  return langTextInfo
}
