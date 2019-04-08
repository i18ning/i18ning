import { parse } from '../..'
import LangTextModel from '../../models/LangTextModel'

describe( "long asynchronous specs", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000
  it( "", done => {} )

  // ... other codes

  const sourceModel = new LangTextModel( `
<0>123</0>
` )

console.log( parse( `<0>12345</0>` ) )
} )