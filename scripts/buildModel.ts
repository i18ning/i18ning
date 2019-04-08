import path from 'path'
import * as rollup from 'rollup'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript'
import webpack from 'webpack'

const PATH_INPUT = path.resolve( __dirname, "../src/models/TextModel.ts" )
const PATH_OUTPUT = path.resolve( __dirname, "../dist/TextModel.js" )
const PATH_TSCONFIG = path.resolve( __dirname, "../tsconfig.json" )

async function buildModel() {
  const bundle = await rollup.rollup( {
    input  : PATH_INPUT,
    plugins: [
      typescript( {
        module                      : "commonJS",
        target                      : "es6",
        jsx                         : "react",
        allowJs                     : true,
        sourceMap                   : true,
        moduleResolution            : "node",
        allowSyntheticDefaultImports: true,
        lib                         : [ "dom", "es2016" ],
        esModuleInterop             : true
      } ),
      commonjs( { extensions: [ '.js', '.ts' ] } ),
    ]
  } )
  await bundle.write( {
    file   : PATH_OUTPUT,
    format : 'iife',
    name   : 'TextModel',
    exports: 'named',
  } )
}

async function buildModelByWebpack() {
  const config = {
    mode  : "production",
    entry : path.resolve( __dirname, "../src/models/TextModel.ts" ),
    output: {
      filename: "TextModel.js",
      path    : path.resolve( __dirname, "../dist" )
    },
    module: {
      rules: [
        {
          test   : /\.ts$/,
          loader : "ts-loader",
          exclude: /node_modules/,
          options: {
            configFile: PATH_TSCONFIG
          }
        }
      ]
    },
    resolve: {
      extensions: [ ".ts", ".js" ]
    }
  }

  const compiler = webpack( config )

  compiler.run( ( err, stats ) => {
    if ( err ) {
      console.error( err )
      return
    }

    console.log(
      stats.toString( {
        chunks: false,
        colors: true
      } )
    )
  } )
}

buildModel()
