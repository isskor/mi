const { webkit, chromium } = require("playwright");
const edgePaths = require("edge-paths");
// const EDGE_PATH = edgePaths.getEdgePath();

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  // const page = await context.newPage()

  // write CSV
  const maxLoops = 736;
  const outFileName = "KickoFinal0501.csv";
  const orgStartNr = 1722; // 20-10k listan
  // await fs.writeFile(outFileName, 'Orgnummer; Name; Phone; Form; Bundet; BindningsTid\n', 'utf8');

  // go to TELIA LOGIN Site +ppppppppppppp.l n
  const page = await context.newPage();
  const url = "https://tholbox.telia.se/privat/mobilt-bredband/abonnemang";
  await page.goto("https://tholbox.telia.se/privat/mobilt-bredband/abonnemang");
  // await page.setDefaultTimeout(10000);

  let loops = 0;
  let NrOfOrg = 0;
  const page2WaitTime = 5000;

  // OPEN all necessary Tabs
  // page1 = telia get phone
  //page2 = telia get data (when you got phone)
  // ProofPage = for orgs
  const page2 = await context.newPage();
  await page2.goto(
    "https://tholbox.telia.se/foeretag/mobilt-bredband/abonnemang"
  );
  // MAX TimeOut 15sek
  await page2.setDefaultTimeout(page2WaitTime);

  // OPEN PROOF csv site
  const ProofPage = await context.newPage();
  await ProofPage.goto("http://127.0.0.1:5500/KickoProff.html");

  // Go get Org numbers
  await ProofPage.waitForSelector("#main > tbody");
  const bolag = await ProofPage.$$("#main > tbody > tr");

  // LOOP each Orgnumber
  for (let i = orgStartNr; i < bolag.length; i++) {
    try {
      await ProofPage.bringToFront("http://127.0.0.1:5500/KickoProff.html");
      await ProofPage.waitForSelector("#main > tbody");
      const bolag = await ProofPage.$$("#main > tbody > tr");
      const orgs = bolag[i];
      const org = await orgs.$("td");
      // Get Orgnumber innerText
      const orgNumber = await ProofPage.evaluate((org) => org.innerText, org);
      // Wait 2 seconds

      // Open TELIA Tab
      await page.bringToFront();
      await page.goto(
        "https://tholbox.telia.se/foeretag/mobilt-bredband/servicetjaenster"
      );
      // wait for load
      await page.waitForSelector(
        "body > div.body.clearfix.container_20 > div.leftCol.grid_4 > ul.leftmenu_bd.attachOrderMenu > li:nth-child(5)"
      );
      await page.waitForTimeout(500);

      // click on hämta abonemang lista
      await page.click(
        "body > div.body.clearfix.container_20 > div.leftCol.grid_4 > ul.leftmenu_bd.attachOrderMenu > li:nth-child(5) > a"
      );
      await page.waitForTimeout(1000);

      await page.waitForSelector(
        "body > div.body.clearfix.container_20 > div.main.grid_12 > iframe"
      );
      // need to target IFRAME

      const frameHandle = await page.$(".orderFrame");
      const frame = await frameHandle.contentFrame();

      // paste ORG
      const OrgInput1 =
        "#Netui_Form_0 > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > input[type=text]";
      await frame.waitForSelector(OrgInput1);
      await frame.type(OrgInput1, orgNumber, { delay: 100 });
      NrOfOrg++;
      // click Next
      await frame.waitForTimeout(500);
      await frame.click(
        "#Netui_Form_0 > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td > button"
      );
      await frame.waitForTimeout(1000);

      // IF NO ORG ERROR

      await frame.waitForTimeout(1000);

      // if OPTIONS EXIST
      await frame.waitForSelector("#Netui_Form_0 > table > tbody");
      if (
        (await frame.$(
          "#Netui_Form_0 > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > select > option:nth-child(1)"
        )) != null
      ) {
        await frame.click("option");
        await frame.waitForTimeout(1000);
        await frame.waitForSelector(
          "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr > td > button.tsButtonRichPurple24"
        );
        await frame.click(
          "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr > td > button.tsButtonRichPurple24"
        );
        await frame.waitForTimeout(500);
      } else {
        await page.waitForTimeout(500);
      }
      // Take Phone Numbers --
      await frame.waitForSelector(
        "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(2)"
      );
      await frame.waitForTimeout(500);

      // IF NO PHONE ERROR
      if (
        (await frame.$(
          "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > span"
        )) == null
      ) {
        continue;
      }

      // Take Phone numbers
      const TelephoneTable = await frame.$$(
        "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr"
      );
      // TAKE MAX 15 NUMBERS
      for (let j = 1; j < TelephoneTable.length; j++) {
        if (j >= 15) {
          break;
        }
        try {
          await frame.waitForSelector(
            "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) "
          );
          const TelephoneTable = await frame.$$(
            "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr"
          );
          const TelephoneNumberS = TelephoneTable[j];
          const Tel = await TelephoneNumberS.$("td");
          // get phone innertext and replace 46 with 0
          const TelephoneNumber = await frame.evaluate(
            (Tel) => Tel.innerText.replace(/^.{2}/g, "0"),
            Tel
          );
          loops++;
          await frame.waitForTimeout(500);

          // GO to Page2 (bring to front)
          await page2.bringToFront();
          await page2.waitForSelector(
            "body > div.body.clearfix.container_20 > div.leftCol.grid_4 > ul.leftmenu_bd.attachOrderMenu > li:nth-child(7)"
          );
          await page2.click(
            "body > div.body.clearfix.container_20 > div.leftCol.grid_4 > ul.leftmenu_bd.attachOrderMenu > li:nth-child(7) > a"
          );
          await page2.waitForTimeout(1000);
          // Get iFrame on Page2

          const frameHandle2 = await page2.$(".orderFrame");
          const frame2 = await frameHandle2.contentFrame();

          // Paste TelephoneNumber
          const TelInput =
            "#Netui_Form_0 > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > input[type=text]";
          await frame2.waitForSelector(TelInput);
          await frame2.type(TelInput, TelephoneNumber, { delay: 100 });
          await frame2.waitForTimeout(500);

          // Click Next - Paste Orgnumber
          await frame2.click(
            "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr > td > button"
          );
          await frame2.waitForTimeout(1000);
          // IF PHONE NUMBER ERROR

          // PASTE ORG

          const OrgInput2 =
            "#Netui_Form_0 > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr > td > input[type=text]";
          await frame2.waitForSelector(OrgInput2);
          await frame2.type(OrgInput2, orgNumber, { delay: 80 });
          await frame2.waitForTimeout(300);
          await frame2.click(
            "#Netui_Form_0 > table > tbody > tr:nth-child(6) > td > table > tbody > tr > td > button.tsButtonRichPurple24"
          );
          await frame2.waitForTimeout(1000);

          // TAKE DATA
          const DataTable =
            "#Netui_Form_0 > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td > table > tbody";
          await frame2.waitForSelector(DataTable);

          const DataName = await frame2.$(
            "#Netui_Form_0 > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(1) > span"
          );
          const FinalName = await frame2.evaluate(
            (DataName) => DataName.innerText,
            DataName
          );

          //const DataOrg = await frame2.$("#Netui_Form_0 > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > span");
          const FinalOrg = orgNumber;

          const DataTel = await frame2.$(
            "#Netui_Form_0 > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(1) > span"
          );
          const FinalPhone = await frame2.evaluate(
            (DataTel) => DataTel.innerText,
            DataTel
          );

          const DataForm = await frame2.$(
            "#Netui_Form_0 > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > span"
          );
          const FinalForm = await frame2.evaluate(
            (DataForm) => DataForm.innerText,
            DataForm
          );

          const DataBundet = await frame2.$(
            "#Netui_Form_0 > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td:nth-child(3) > span"
          );
          const FinalBundet = await frame2.evaluate(
            (DataBundet) => DataBundet.innerText,
            DataBundet
          );

          await frame2.waitForTimeout(200);

          if (FinalBundet == "Ja") {
            const bindning = await frame2.$(
              "#Netui_Form_0 > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr:nth-child(5) > td.bold > span"
            );
            finalBindning = await frame2.evaluate(
              (bindning) => bindning.innerText,
              bindning
            );
          } else {
            finalBindning = " ";
          }

          var Finaldata = {
            name: FinalName,
            OrgNummer: FinalOrg,
            ph: FinalPhone,
            Form: FinalForm,
            Bundet: FinalBundet,
            BindngingsTid: finalBindning,
          };

          await fs.appendFile(
            outFileName,
            `"${FinalName}";"${FinalOrg}";"${FinalPhone}";"${FinalForm}";"${FinalBundet}";"${finalBindning}"\n`,
            `utf-8`
          );

          console.log(loops);
          console.log(NrOfOrg);

          await page2.waitForTimeout(200);
        } catch (err) {}
      } // end of PhoneNumber Loop
    } catch (err2) {}
    if (loops > maxLoops) {
      await browser.close();
      break;
    }
  }
  // end of ORG loop
})();
