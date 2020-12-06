const { webkit, chromium } = require("playwright");
const edgePaths = require("edge-paths");
const fs = require("fs-extra");
// const EDGE_PATH = edgePaths.getEdgePath();
(async () => {
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();

  // WRITE INPUT FILE
  const inputFile = "1mtill2m.csv";
  // WRITE START NUMBER FROM INPUT FILE  ************
  const orgStartNr = 273;
  // WRITE OUTPUT NAME  ***************
  const outFileName = "outputFile.csv";

  let loops = 0;
  const maxLoops = 100;
  //   let NrOfOrg = 100;
  //   const page2WaitTime = 5000;
  //   const orgNummer = "556074-3089";

  // go to Site
  const page = await context.newPage();
  const url = "https://www.merinfo.se/search?who=556144-9553&where=";
  await page.goto(url);
  // await page.setDefaultTimeout(10000);

  //   await fs.writeFile(
  //     outFileName,
  //     "OrgNumber; PhoneNumber; Operator \n",
  //     "utf8"
  //   );

  await page.click(
    "#qc-cmp2-ui > div.qc-cmp2-footer.qc-cmp2-footer-overlay.qc-cmp2-footer-scrolled > div > button.sc-ifAKCX.hEtmUQ"
  );
  await page.waitForTimeout(500);

  // ADD INPUT FILE, LOOP OVER FILE

  fs.readFile(inputFile, "utf8", async (err, data) => {
    let dataArray = data.split(/\r?\n/);
    bolag = dataArray.map((el) => el.replace(/-/g, ""));

    for (let i = orgStartNr; i < bolag.length; i++) {
      try {
        loops++;
        const orgNumber = bolag[i];

        const searchField =
          "#form-search > div > div.col-12.col-md.no-gutters.order-2.order-md-1 > div > input";
        await page.waitForSelector(searchField);

        await page.fill(searchField, orgNumber);

        const searchButton =
          "#form-search > div > div.col-12.col-md-auto.no-gutters.order-4.order-md-3 > div > button";

        await page.click(searchButton);

        const visaAllaTel =
          "#result-list > div > div:nth-child(1) > div.col-12.col-md-auto.text-left.text-md-right > div > a";

        const allaTele = await page.waitForSelector(visaAllaTel, {
          timeout: 1000,
        });
        if (!allaTele) continue;
        await page.click(visaAllaTel);

        const phoneTable = "#phonetable > tbody";
        await page.waitForTimeout(1000);
        await page.waitForSelector(phoneTable);

        const phoneNumbers = await page.$$(`${phoneTable} > tr`);

        phoneNumbers.map(async (number) => {
          try {
            const operatorSelector = await number.$("td:nth-child(3)");
            const operator = await page.evaluate(
              (op) => op.innerText,
              operatorSelector
            );
            // if (!/\b(\w*telia\w*)\b/gi.test(operator)) return;

            const phoneNumSelector = await number.$("td:nth-child(1)");
            // const phoneNumUserSelector = await number.$("td:nth-child(2)");

            const phoneNum = await page.evaluate(
              (ph) => ph.innerText,
              phoneNumSelector
            );
            // const phoneUserNum = await page.evaluate(
            //   (ph) => ph.innerText,
            //   phoneNumUserSelector
            // );

            console.log(phoneNum, operator, loops);
            await fs.appendFile(
              outFileName,
              `"${orgNumber}"; "${phoneNum}"; "${operator}"\n`
            );
          } catch (err) {}
        });
      } catch (err) {}
      console.log(loops);
      if (loops > maxLoops) {
        await browser.close();
        break;
      }
    }
  });
})();
