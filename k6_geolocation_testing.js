import { chromium } from 'k6/experimental/browser'
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js'

export default async function () {
  const capabilities = {
    'browserName': 'Chrome',
    'browserVersion': 'latest',
    'LT:Options': {
      'platform': 'MacOS Ventura',
      'build': 'K6 Build',
      'name': 'K6 Geolocation Test',
      'user': `${__ENV.LT_USERNAME}`,
      'accessKey': `${__ENV.LT_ACCESS_KEY}`,
      'network': true,
      'video': true,
      'console': true,
      'tunnel': false, // Add tunnel configuration if testing locally hosted webpage
      'tunnelName': '', // Optional
      'geoLocation': 'AU/BS' // geoLocation code can be fetched from https://www.lambdatest.com/capabilities-generator/
    }
  }

  const wsURL = `wss://cdp.lambdatest.com/k6?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`
  const browser = chromium.connect(wsURL)

  const page = browser.newPage()

  try {
    await page.goto('https://www.ipinfo.io')
    let country = await page.locator('div > ul > #country-string > div > span > span:nth-child(2) > span').textContent()
    let city = await page.locator('div > ul > #city-string > div > span > span:nth-child(2) > span').textContent()

    console.log(`Country:: ${country}, City:: ${city}`)

    expect(country).to.equal('AU')
    expect(city).to.equal('Brisbane')

    // Mark the test as passed or failed
    await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: 'setTestStatus', arguments: { status: 'passed', remark: 'Assertions passed' } })}`)

    await teardown(page, browser)
  } catch (e) {
    console.log('Error:: ', JSON.stringify(e))
    await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: 'setTestStatus', arguments: { status: 'failed', remark: JSON.stringify(e) } })}`)

    await teardown(page, browser)
    throw e
  }
};

async function teardown(page, browser) {
  await page.close();
  await browser.close();
}
