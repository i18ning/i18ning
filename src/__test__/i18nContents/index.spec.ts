import path from 'path'

import i18nContents from '../../exposedHelper/i18nContents'

describe( "long asynchronous specs", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000
  it( "", done => {} )

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
    syncConfig
  }
  i18nContents( source, target, config )
} )
