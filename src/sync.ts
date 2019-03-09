import chokidar, { FSWatcher } from 'chokidar'
import fs from 'fs-extra'
import glob from 'glob'
import path from 'path'

import { TYPE_NTING } from './constants'
import LangTextModel, { getLangTextInfo } from './model/LangTextModel'

export default function sync(
  sourceFolder: string,
  outputFolder: string,
  langs: string[] = []
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

  let watchingItems: WatchingItem[] = []
  langFiles.forEach( langFile => {
    if ( fs.existsSync( langFile ) ) {
      const listener = ( a, b ) => {
        watchingItems.forEach( watchingItem => watchingItem.pause() )
        // update other lang files
        const current = getLangTextInfo( langFile )
        langFiles
          .filter( file => file !== langFile && fs.existsSync( file ) )
          .forEach( file => {
            const prevFileText = fs.readFileSync( file, { encoding: "utf8" } )
            const target = getLangTextInfo( file )
            // # update sections
            // ## check if every section exist
            // ### if not, create from referring section
            // ### if exists and referring section's type is nting, update its inner text
            current.sections.forEach( ( currentSection, index ) => {
              const targetSection = target.sections[ index ]

              if ( targetSection == null ) {
                // add section
                target.addSection( currentSection, index )
              }
              if ( targetSection != null ) {
                target.updateSection( currentSection, index )
              }
            } )

            // # remove extra sections in target
            let indices = []
            for (
              let i = current.sections.length;
              i <= target.sections.length - 1;
              i++
            ) {
              indices.push( i )
            }
            target.removeSectionByIndices( indices )

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

function getPathFileName( filePath: string ) {
  const name = path.basename( filePath )
  const ext = path.extname( filePath )
  return name.replace( new RegExp( ext ), "" )
}
