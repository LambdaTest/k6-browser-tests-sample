import { chromium } from 'k6/experimental/browser';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';
export default async function () {
  const capabilities = {
    "browserName": "Chrome",
    "browserVersion": "latest",
    "LT:Options": {
      "platform": "MacOS Ventura",
      "build": "K6 Build",
      "name": "K6 Test",
      "user": `${__ENV.LT_USERNAME}`,
      "accessKey": `${__ENV.LT_ACCESS_KEY}`,
      "network": true,
      "video": true,
      "console": true,
      'tunnel': false, // Add tunnel configuration if testing locally hosted webpage
      'tunnelName': '', // Optional
      'geoLocation': '', // country code can be fetched from https://www.lambdatest.com/capabilities-generator/
    },
  };

  const wsURL = `wss://cdp.lambdatest.com/puppeteer?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`
  const browser = chromium.connect(wsURL);

  const page = browser.newPage();

  try {
    await page.goto("https://duckduckgo.com");
    await page.screenshot({path: 'screenshots/k6Screenshot.png'});

    let element = await page.$("[name=\"q\"]");
    await element.click();
    await element.type("Playwright");
    await element.press("Enter");
    let title = await page.title();

    try {
      expect(title).to.equal("Playwright at DuckDuckGo");
      // Mark the test as passed or failed
      await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: "setTestStatus", arguments: {status: "passed", remark: "Assertions passed" },})}`);
    } catch (e) {
      await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({action: "setTestStatus", arguments: { status: "failed", remark: e.stack }})}`);
      console.log("Error:: ", e.stack);
    }
  } finally {
    page.close();
    browser.close();
  }
};
