import chokidar from 'chokidar'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'

import sync, { parse } from '../index'

class Config {
  locales: string[]
  extension: string
  backupName: string
  syncConfig: any
}

export default function(
  sourceFolder: string,
  targetFolder: string,
  config: Config
) {
  const {
    locales,
    extension,
    backupName,
    syncConfig = {
      enableTranslation: true
    }
  } = config
  const markdownDirs = ( () => {
    const files = glob.sync( `${sourceFolder}/**/*${extension}` )
    let dirs = files
      .filter( file => locales.some( locale => path.parse( file ).name === locale ) )
      .map( file => path.dirname( file ) )
    dirs = [ ...new Set( dirs ) ]
    return dirs
  } )()

  markdownDirs.map( markdownDir => {
    const files = locales.map( name =>
      path.resolve( markdownDir, `${name}${extension}` )
    )
    const backup = path.resolve( markdownDir, backupName )
    sync( files, {
      backup,
      ...syncConfig
    } )
  } )

  chokidar
    .watch( `${sourceFolder.replace( /\\/g, '/' )}/**/*${extension}`, {
      ignored         : new RegExp( backupName ),
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval      : 100
      },
    } )
    .on( "change", filePath => {
      const relativePath = path.relative( sourceFolder, filePath )
      const outputFilePath = path.resolve( targetFolder, relativePath )
      const sourceText = fs.readFileSync( filePath, { encoding: "utf8" } )
      const info = parse( sourceText )
      const outputText = info.text
      fs.outputFileSync( outputFilePath, outputText, { encoding: "utf8" } )
    } )
}
