import puppeteer from 'puppeteer';
import fs from 'fs';

let browser: puppeteer.Browser;
let page: puppeteer.Page;

const scrapeSyllabus = async () => {
  if (!page) {
    browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: false,
    });
    page = await browser.newPage();
  }

  await page.goto(
    'https://syllabus01.academic.hokudai.ac.jp/Syllabi/Public/Syllabus/SylSearch.aspx',
    { waitUntil: 'domcontentloaded' }
  );
  await page.waitFor('#ctl00_phContents_ucSylSearchuc_ddl_org', {
    timeout: 10000,
  });
  await page.select('#ctl00_phContents_ucSylSearchuc_ddl_org', '02');
  await page.waitFor(100);
  await page.waitFor('#ctl00_phContents_ucSylSearchuc_ddl_fac', {
    timeout: 10000,
  });
  await page.select('#ctl00_phContents_ucSylSearchuc_ddl_fac', '00');
  await page.waitFor(100);
  await page.waitFor('#ctl00_phContents_ucSylSearchuc_ctl109_btnSearch', {
    timeout: 10000,
  });
  await page.click('#ctl00_phContents_ucSylSearchuc_ctl109_btnSearch');
  await page.waitFor(100);
  await page.waitFor('#ctl00_phContents_ucSylList_DDLLine_ddl', {
    timeout: 10000,
  });
  await page.select('#ctl00_phContents_ucSylList_DDLLine_ddl', '0');
  await page.waitFor(8000);
  await page.waitFor('#ctl00_phContents_ucSylList_gv', {
    timeout: 10000,
  });

  const classItems: ClassItem[] = await page.evaluate(() => {
    const items: ClassItem[] = [];
    document
      .querySelectorAll('#ctl00_phContents_ucSylList_gv > tbody > tr')
      .forEach((row, idx) => {
        if (idx === 0) {
          return;
        }

        const colTexts: string[] = [];
        row.querySelectorAll('td').forEach((col) => {
          const str = col.innerText || '\n';
          const splited = str.split('\n');
          if (splited.length <= 2) {
            colTexts.push(splited[0]);
          } else {
            colTexts.push(splited.slice(0, -2).join(' '));
          }
        });

        const item: ClassItem = {
          semester: colTexts[1],
          courseTitle: colTexts[2],
          teachingStaff: colTexts[3],
          day: colTexts[4] === '集中' ? colTexts[4] : colTexts[4][0] + '曜日',
          period: colTexts[4] === '集中' ? '' : colTexts[4][1],
          eligibleYear: colTexts[5],
        };
        items.push(item);
      });

    return items;
  });
  fs.writeFileSync('output/classItems.json', JSON.stringify(classItems));

  const classDetails: any[] = [];
  for (let i = 0; i < classItems.length; i++) {
    let btn_idx = String(i + 2);
    if (btn_idx.length === 1) {
      btn_idx = '0' + btn_idx;
    }

    // Press Ctrl key
    await page.keyboard.down('ControlLeft');

    await page.click(
      `#ctl00_phContents_ucSylList_gv_ctl${btn_idx}_btnReferJpn`
    );
    // Leave Ctrl key
    await page.keyboard.up('ControlLeft');
    await page.waitFor(5000);

    const pages = await browser.pages();
    const newPage = pages[pages.length - 1];
    await newPage.bringToFront();

    await newPage.waitFor(
      '#ctl00_phContents_ucSylDetail_ucSummary_lbl_sbj_name',
      {
        timeout: 10000,
      }
    );
    classDetails.push(
      await newPage.evaluate(() => {
        const element = document.querySelector(
          '#ctl00_phContents_ucSylDetail_ucSummary_lbl_sbj_name'
        );
        return element ? element.textContent : '';
      })
    );

    await newPage.close();
  }
  fs.writeFileSync('output/classDetails.json', JSON.stringify(classDetails));

  console.log(`Classes : ${classItems.length}`);
  console.log('Successfully fetched');
};

export default scrapeSyllabus;
