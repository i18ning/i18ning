import PuppeteerModel from './models/PuppeteerModel'

const engineMap = {
  google: {
    url           : "https://translate.google.com/",
    setTranslating: text => {
      ;( <any>document.getElementById( "source" ) ).value = text
    },
    getTranslated: () =>
      ( <any>document.getElementsByClassName( "translation" )[ 0 ] ).innerText
  },
  youdao: {
    url           : "http://fanyi.youdao.com/",
    setTranslating: text => {
      ;( <any>document.getElementById( "inputOriginal" ) ).value = text
      document.getElementById( "transMachine" ).click()
    },
    getTranslated: maxWaitTime => {
      return new Promise( ( resolve, reject ) => {
        const output = document.getElementById( "transTarget" )
        let timer = setInterval( () => {
          const { innerText } = output
          if ( innerText !== "" ) {
            clearInterval( timer )
            resolve( innerText )
          }
        }, 33 )
        setTimeout( () => {
          clearInterval( timer )
          reject()
        }, maxWaitTime )
      } )
    },
    waitTime: 100
  }
}

export default function translate(
  puppeteerModel: PuppeteerModel,
  text: string
) {
  return puppeteerModel.search( { waitTime: 1000, ...engineMap.youdao, text } )
}
