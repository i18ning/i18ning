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
  placeholder?: string
  // # translation
  enableTranslation?: boolean = false
  puppeteerModel?: any
  chromeHeadless?: boolean = true
}

let puppeteerModel

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
  const existingLangFiles = langFiles.filter( file => fs.existsSync( file ) )


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
      this.watcher = chokidar.watch( this.file, {
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval      : 100
        },
      } ).on( "change", ( ...args ) => {
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

  let watchingItems: WatchingItem[] = []

  const { enableTranslation, chromeHeadless } = currentConfig
  if ( enableTranslation && puppeteerModel == null ) {
    puppeteerModel = new PuppeteerModel( chromeHeadless )
  }

  const translateFn = text => translate( puppeteerModel, text )
  let isTranslating = false

  const { placeholder } = currentConfig
  existingLangFiles &&
    existingLangFiles.forEach( langFile => {
      const listener = () => {
        watchingItems.forEach( watchingItem => watchingItem.pause() )
        const referring = getLangTextInfo( langFile, {
          isRoot    : true,
          placeholder,
          syncConfig: currentConfig
        } )
        const previousText = referring.text
        referring.convertPlaceholderSectionsToSections()
        const convertedText = referring.text
        if ( previousText !== convertedText ) {
          fs.outputFileSync( langFile, convertedText, { encoding: "utf8" } )
        }

        // # update other lang files
        existingLangFiles
          .filter( file => file !== langFile && fs.existsSync( file ) )
          .forEach( file => {
            const prevFileText = fs.readFileSync( file, { encoding: "utf8" } )

            const target = getLangTextInfo( file, {
              isRoot    : true,
              syncConfig: currentConfig
            } )

            isTranslating = true
            target.updateByReferring( referring, translateFn ).then( () => {
              isTranslating = false
              // // # update yaml
              target.updateYaml( referring )

              // output file
              if ( prevFileText !== target.text ) {
                fs.outputFileSync( file, target.text, { encoding: "utf8" } )
              }
            } )
          } )

        // // # backup
        // const { enableBackup } = currentConfig
        // if ( enableBackup ) {
        //   const { backup: backupDirectory, backupCount } = currentConfig
        //   backup( existingLangFiles, backupDirectory, backupCount )
        // }

        setTimeout( () => {
          watchingItems.forEach( watchingItem => watchingItem.resume() )
        }, 500 )
      }
      const watchingItem = new WatchingItem( langFile, listener )
      watchingItems.push( watchingItem )
    } )
}
