import chokidar, { FSWatcher } from 'chokidar'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'

import { TYPE_NTING, TYPE_TING, YAML_LEFT, YAML_REGEXP, YAML_RIGHT } from './constants'
import LangTextModel, { getLangTextInfo } from './model/LangTextModel'

export class Config {
  mode: string = TYPE_NTING
}

export default function sync(
  sourceFolder: string,
  outputFolder: string,
  langs: string[] = [],
  config: Config = new Config()
) {
  // # check if lang files exist
  // ## if not, add lang files
  langs.map( lang => {
    const langFile = path.resolve( sourceFolder, `${lang}.txt` )
    if ( !fs.existsSync( langFile ) ) {
      fs.writeFileSync( langFile, "", { encoding: "utf8" } )
    }
  } )

  // # watch all lang files, if changed, update other lang files
  const langFiles = langs.map( lang => path.resolve( sourceFolder, `${lang}.txt` ) )

  // console.log( getLangTextInfo( langFiles[ 0 ] ).sections )

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

  const { mode } = config
  let watchingItems: WatchingItem[] = []
  langFiles.forEach( langFile => {
    if ( fs.existsSync( langFile ) ) {
      const listener = () => {
        watchingItems.forEach( watchingItem => watchingItem.pause() )

        const referring = getLangTextInfo( langFile, mode )

        // console.log( referring.convertedText )

        // get variables map from yaml data
        const { sections: referringSections } = referring

        // update other lang files
        langFiles
          .filter( file => file !== langFile && fs.existsSync( file ) )
          .forEach( file => {
            const prevFileText = fs.readFileSync( file, { encoding: "utf8" } )

            const target = getLangTextInfo( file, mode )

            target.updateByReferring( referring )

            // // # update yaml
            // target.updateYaml( referring )

            // output file
            if ( prevFileText !== target.text ) {
              fs.outputFileSync( file, target.text, { encoding: "utf8" } )
            }
          } )
        setTimeout( () => {
          watchingItems.forEach( watchingItem => watchingItem.resume() )
        }, 500 )
      }
      const watchingItem = new WatchingItem( langFile, listener )
      watchingItems.push( watchingItem )
    }
  } )
}
