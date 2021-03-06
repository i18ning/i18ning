// const puppeteer = require( "puppeteer" )
import puppeteer from 'puppeteer'

export default class PuppeteerModel {
  maxTranslatingTime = 5000
  browser: any
  page: any

  constructor( headless = false ) {
    this.init( headless )
  }

  init = async function( headless = false ) {
    this.browser = await puppeteer.launch( {
      headless,
    } )
    this.page = await this.browser.newPage()
  }

  search = async function( {
    url,
    setTranslating,
    getTranslated,
    waitTime,
    text = "",
    noRefresh = false
  } ) {
    let target
    let hasGottenTarget = false
    let page
    let pagehasBeenClosed = false

    const work = async () => {
      const { page } = this

      if ( noRefresh && page.url() === "about:blank" ) {
        await page.goto( url )
      }

      if ( !noRefresh ) {
        await page.goto( url )
      }

      await page.evaluateHandle( setTranslating, text )

      const translatedHandle: any = await page.evaluateHandle(
        getTranslated,
        waitTime,
        text
      )
      const translated = await translatedHandle.jsonValue()

      // await page.screenshot({ path: "example.png" });
      target = await translated
      hasGottenTarget = true
      // !pagehasBeenClosed && page.close()
    }

    work()

    return new Promise( ( resolve, reject ) => {
      let timer = setInterval( () => {
        if ( hasGottenTarget ) {
          clearInterval( timer )
          // page.close()
          pagehasBeenClosed = true
          resolve( target )
        }
      } )
      setTimeout( () => {
        clearInterval( timer )
        // !pagehasBeenClosed && page.close()
        reject( target )
      }, this.maxTranslatingTime )
    } )
  }
}
