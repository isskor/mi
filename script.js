const { prependListener } = require("cluster");
const { webkit, chromium } = require("playwright");
const { isContext } = require("vm");

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://jerryphuong.se/uno");

  await page.click('xpath=//*[@id="blog"]/div[2]/aside/ul/li[1]/a');
  context.on("page", async (newPage) => {
    console.log("newPage", await newPage.title());
    await newPage.type('xpath=//*[@id="newsletterEmailInput"]', "123");
  });

  // emulate some opening in a new tab or popup
  //await page.evaluate(() => window.open("https://google.com", "_blank"));
  // Keep in mind to have some blocking action there so that the browser won't be closed. In this case we are just waiting 2 seconds.
  //await page.waitForTimeout(2000);
  // await browser.close();
})();
