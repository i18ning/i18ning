import fs from 'fs-extra'
import path from 'path'
import trash from 'trash'

import { formatNormalDate } from './utils/time'

const DEFAULT_BACKUP_FOLDER_NAME = ".i18n-sync-backup"

export default function(
  langfiles: string[],
  directory: string = path.resolve(
    process.cwd(),
    `${DEFAULT_BACKUP_FOLDER_NAME}`
  ),
  count: number = 100
) {
  try {
    // # resolve histories
    if ( fs.existsSync( directory ) ) {
      const info = fs.readdirSync( directory )
      if ( info.length >= count ) {
        const sorted = info.sort( ( dirNameA, dirNameB ) => {
          const dirA = path.resolve( directory, dirNameA )
          const dirB = path.resolve( directory, dirNameB )
          try {
            const { birthtimeMs: createTimeA } = fs.statSync( dirA )
            const { birthtimeMs: createTimeB } = fs.statSync( dirB )
            if ( createTimeA > createTimeB ) {
              return 1
            }
            if ( createTimeA < createTimeB ) {
              return -1
            }
          } catch ( e ) {
            console.log( e )
          }

          return 0
        } )

        const oldest = path.resolve( directory, sorted[ 0 ] )
        if ( fs.existsSync( oldest ) ) {
          trash( oldest )
        }
      }
    }

    // # copy lang files into a new backup folder named with then time string
    const timeStr = formatNormalDate()
    langfiles
      .filter( langFile => fs.existsSync( langFile ) )
      .forEach( langFile => {
        const targetDir = path.resolve( directory, timeStr )
        const targetFile = path.resolve( targetDir, path.basename( langFile ) )

        if ( !fs.existsSync( targetDir ) ) {
          fs.mkdirSync( targetDir, { recursive: true } )
        }
        fs.copyFileSync( langFile, targetFile )
      } )
    return
  } catch ( e ) {
    console.log( `Backup Failed: ${e}` )
    return
  }
}
