import chokidar, { FSWatcher } from 'chokidar'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'

import backup from './backup'
import { TYPE_NTING, TYPE_TING, YAML_LEFT, YAML_REGEXP, YAML_RIGHT } from './constants'
import PuppeteerModel from './models/PuppeteerModel'
import { getLangTextInfo } from './store/store'
import translate from './translate'

export class Config {
  backup?: string
  enableBackup?: boolean = true
  backupCount?: number
}

export default function sync( langFiles: string[], config: Config = {} ) {
  // // # check if lang files exist
  // // ## if not, add lang files
  // langFiles.forEach( langFile => {
  //   if ( !fs.existsSync( langFile ) ) {
  //     fs.writeFileSync( langFile, "", { encoding: "utf8" } )
  //   }
  // } )
  if ( langFiles != null && langFiles.length === 0 ) {
    return
  }

  const currentConfig = {
    ...new Config(),
    ...config
  }

  // # watch all lang files, if changed, update other lang files
  class WatchingItem {
    file: string
    onChangeListener: any
    isPaused: boolean = false
    private watcher: FSWatcher
    constructor( file: string, onChangeListener: any ) {
      this.file = file
      this.onChangeListener = onChangeListener
      this.watcher = chokidar.watch( this.file ).on( "change", ( ...args ) => {
        if ( !this.isPaused ) {
          this.onChangeListener( ...args )
        }
      } )
    }

    pause = () => {
      this.isPaused = true
    }

    resume = () => {
      this.isPaused = false
    }
  }

  const mode = TYPE_NTING
  let watchingItems: WatchingItem[] = []

  const puppeteerModel = new PuppeteerModel()

  puppeteerModel.init()
  const translateFn = text => translate( puppeteerModel, text )
  let isTranslating = false

  langFiles &&
    langFiles.forEach( langFile => {
      const listener = () => {
        watchingItems.forEach( watchingItem => watchingItem.pause() )

        const referring = getLangTextInfo( langFile, mode, true )

        // # update other lang files
        langFiles
          .filter( file => file !== langFile && fs.existsSync( file ) )
          .forEach( file => {
            const prevFileText = fs.readFileSync( file, { encoding: "utf8" } )

            const target = getLangTextInfo( file, mode, true )

            isTranslating = true
            target.updateByReferring( referring, translateFn ).then( () => {
              isTranslating = false
              // // # update yaml
              target.updateYaml( referring )

              // console.log( target.convertedText )

              // output file
              if ( prevFileText !== target.text ) {
                fs.outputFileSync( file, target.text, { encoding: "utf8" } )
              }
            } )
          } )

        // # backup
        const { enableBackup } = currentConfig
        if ( enableBackup ) {
          const { backup: backupDirectory, backupCount } = config
          backup( langFiles, backupDirectory, backupCount )
        }

        setTimeout( () => {
          watchingItems.forEach( watchingItem => watchingItem.resume() )
        }, 500 )
      }
      const watchingItem = new WatchingItem( langFile, listener )
      watchingItems.push( watchingItem )
    } )
}
