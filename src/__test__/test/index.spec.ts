import path from 'path'

import sync from '../../sync'

describe( "long asynchronous specs", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000
  it( "", done => {} )
  
  const langFiles = [
    path.resolve( __dirname, "data/en.txt" ),
    path.resolve( __dirname, "data/cn.txt" ),
    path.resolve( __dirname, "data/es.txt" )
  ]
  sync( langFiles, {
    backup           : path.resolve( __dirname, ".backup" ),
    // enableBackup     : false,
    enableTranslation: true
  } )
} )
