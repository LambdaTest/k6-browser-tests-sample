import { chromium } from 'k6/experimental/browser';
import { expect } from 'https://jslib.k6.io/k6chaijs/4.3.4.3/index.js';

export default async function () {
  const capabilities = {
    "browserName": "Chrome",
    "browserVersion": "latest",
    "LT:Options": {
      "platform": "MacOS Ventura",
      "build": "K6 Build",
      "name": "K6 SmartUI test",
      "user": __ENV.LT_USERNAME,
      "accessKey": __ENV.LT_ACCESS_KEY,
      "network": true,
      "video": true,
      "console": true,
      'tunnel': false, // Add tunnel configuration if testing locally hosted webpage
      'tunnelName': '', // Optional
      'geoLocation': '', // country code can be fetched from https://www.lambdatest.com/capabilities-generator/
      'smartUIProjectName': 'Homepage', // Add the required Smart UI Project name
    },
  };

  const wsURL = `wss://cdp.lambdatest.com/k6?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`
  const browser = chromium.connect(wsURL);

  const page = browser.newPage();

  try {
    await page.goto("https://duckduckgo.com");

    // Add the following command in order to take screenshot in SmartUI
    await captureSmartUIScreenshot(page, "Homepage")

    let element = await page.$("[name=\"q\"]");
    await element.click();
    await element.type("K6");
    await element.press("Enter");
    let title = await page.title();

    expect(title).to.equal("K6 at DuckDuckGo");

    // Pass the `page` object. Add `screennshotName` if you want to fetch response for a specific screenshot
    await validateSmartUIScreenshots(page)

    // Mark the test as passed or failed
    await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: "setTestStatus", arguments: { status: "passed", remark: "Assertions passed" },})}`);
    await teardown(page, browser)
  } catch (e) {
      console.log('Error:: ', JSON.stringify(e))
      await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: 'setTestStatus', arguments: { status: 'failed', remark: JSON.stringify(e) } })}`)

    await teardown(page, browser)
    throw e
  }
};

async function captureSmartUIScreenshot(page, screenshotName) {
  await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: "smartui.takeScreenshot", arguments: { screenshotName: screenshotName } })}`);
}

async function teardown(page, browser) {
  await page.close();
  await browser.close();
}

const validateSmartUIScreenshots = async (page, screenshotName) => {
  try {
    await page.waitForTimeout(10000) // Added delay to get reports of all screenshots captured

    let screenshotResponse = JSON.parse(await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: 'smartui.fetchScreenshotStatus', arguments: { screenshotName }})}`))
    console.log('screenshotStatus response: ', screenshotResponse)

    if (screenshotResponse.screenshotsData && Array.isArray(screenshotResponse.screenshotsData)) {
      for (let i = 0; i < screenshotResponse.screenshotsData.length; i++) {
        let screenshot = screenshotResponse.screenshotsData[i];
        if (screenshot.screenshotStatus !== "Approved") {
          throw new Error(`Screenshot status is not approved for the screenshot ${screenshot.screenshotName}`);
        }
      }
    }
  } catch (error) {
    throw new Error(error);
  }
}
