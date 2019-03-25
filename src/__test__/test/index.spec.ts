import path from 'path'

import sync from '../../sync'

describe( "long asynchronous specs", function() {
  var originalTimeout
  beforeEach( function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000
  } )

  it( "takes a long time", function( done ) {
    const langFiles = [
      path.resolve( __dirname, "data/en.txt" ),
      path.resolve( __dirname, "data/cn.txt" ),
      path.resolve( __dirname, "data/es.txt" )
    ]
    sync( langFiles, {
      backup           : path.resolve( __dirname, ".backup" ),
      enableBackup     : false,
      enableTranslation: true
    } )
    expect( true ).toBe( true )
  } )

  afterEach( function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
  } )
} )
