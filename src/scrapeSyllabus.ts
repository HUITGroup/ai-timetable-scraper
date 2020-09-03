import puppeteer from 'puppeteer';

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
  await page.select('#ctl00_phContents_ucSylSearchuc_ddl_fac', '05');
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
  await page.waitFor(100);
  await page.waitFor('#ctl00_phContents_ucSylList_gv', {
    timeout: 10000,
  });
  const subjects = await page.evaluate((selector) => {
    return document.querySelector(selector).textContent;
  }, '#ctl00_phContents_ucSylList_gv');
  console.log(subjects);
};

export default scrapeSyllabus;
