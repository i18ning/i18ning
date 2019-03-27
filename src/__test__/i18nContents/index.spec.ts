import path from 'path'

import i18nContents from '../../exposedHelper/i18nContents'

describe( "long asynchronous specs", function() {
  var originalTimeout
  beforeEach( function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
  } )

  it( "takes a long time", function( done ) {
    const locales = [ "en", "cn" ]
    const backupName = ".backup"
    const syncConfig = {
      enableTranslation: true,
      chromeHeadless   : false
    }
    const source = path.resolve( __dirname, "contents" )
    const target = path.resolve( __dirname, "build-contents" )
    const extension = ".md"
    const config = {
      locales,
      extension,
      backupName,
      syncConfig,
    }
    i18nContents( source, target, config )
  } )

  afterEach( function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
  } )
} )
