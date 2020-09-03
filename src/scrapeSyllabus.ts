import puppeteer from 'puppeteer';
import fs from 'fs';

let page: puppeteer.Page;

const getBrowserPage = async () => {
  // Launch headless Chrome. Turn off sandbox so Chrome can run under root.
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  return browser.newPage();
};

const scrapeSyllabus = async () => {
  if (!page) {
    page = await getBrowserPage();
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
  await page.waitFor(10000);
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

  console.log(`Classes : ${classItems.length}`);
  console.log('Successfully fetched');
};

export default scrapeSyllabus;
