import path from 'path'

import sync from '../../sync'

describe( "long asynchronous specs", function() {
  var originalTimeout
  beforeEach( function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000
  } )

  it( "takes a long time", function( done ) {
    const source = path.resolve( __dirname, "source" )
    const output = path.resolve( __dirname, "output" )
    sync( source, output, [ `en`, `cn` ] )
    expect( true ).toBe( true )
  } )

  afterEach( function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
  } )
} )
