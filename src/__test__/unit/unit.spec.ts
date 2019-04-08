import { parse } from '../..'
import TextModel from '../../models/TextModel'

describe( "long asynchronous specs", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000
  it( "", done => {} )

  // ... other codes

  const sourceModel = new TextModel( `
<0>123</0>
` )

// console.log( parse( `<0>12345</0>` ) )
} )