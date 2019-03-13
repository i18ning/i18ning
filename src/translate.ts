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
    getTranslated: () => document.getElementById( "transTarget" ).innerText,
    waitTime     : 1000
  }
}

export default function translate(
  puppeteerModel: PuppeteerModel,
  text: string
) {
  return puppeteerModel.search( { waitTime: 1000, ...engineMap.youdao, text } )
}
