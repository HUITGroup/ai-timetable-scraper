import puppeteer from 'puppeteer';
import fs from 'fs';

let page: puppeteer.Page;

const getBrowserPage = async () => {
  // Launch headless Chrome. Turn off sandbox so Chrome can run under root.
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  return browser.newPage();
};

const fetchParams = async () => {
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

  const years: {
    [key: string]: string;
  } = await page.evaluate((selector) => {
    const params: { [key: string]: string } = {};
    document.querySelectorAll(selector).forEach((value) => {
      if (value.value !== 'NULL') {
        params[value.textContent] = value.value;
      }
    });
    return params;
  }, '#ctl00_phContents_ucSylSearchuc_ddl_year > option');

  const orgs: {
    [key: string]: {
      [key: string]: string;
    };
  } = {};
  const facs: {
    [key: string]: {
      [key: string]: {
        [key: string]: string;
      };
    };
  } = {};

  for (const year in years) {
    if (!years[year]) {
      delete years[year];
      continue;
    }

    await page.select('#ctl00_phContents_ucSylSearchuc_ddl_year', years[year]);
    await page.waitFor(100);
    await page.waitFor('#ctl00_phContents_ucSylSearchuc_ddl_org', {
      timeout: 10000,
    });

    orgs[year] = await page.evaluate((selector) => {
      const params: { [key: string]: string } = {};
      document.querySelectorAll(selector).forEach((value) => {
        if (value.value !== 'NULL') {
          params[value.textContent] = value.value;
        }
      });
      return params;
    }, '#ctl00_phContents_ucSylSearchuc_ddl_org > option');
    facs[year] = {};

    for (const org in orgs[year]) {
      await page.select(
        '#ctl00_phContents_ucSylSearchuc_ddl_org',
        orgs[year][org]
      );
      await page.waitFor(100);
      await page.waitFor('#ctl00_phContents_ucSylSearchuc_ddl_fac', {
        timeout: 10000,
      });

      facs[year][org] = await page.evaluate((selector) => {
        const params: { [key: string]: string } = {};
        document.querySelectorAll(selector).forEach((value) => {
          if (value.value !== 'NULL') {
            params[value.textContent] = value.value;
          }
        });
        return params;
      }, '#ctl00_phContents_ucSylSearchuc_ddl_fac > option');
    }
  }

  const grads: {
    [key: string]: string;
  } = await page.evaluate((selector) => {
    const params: { [key: string]: string } = {};
    document.querySelectorAll(selector).forEach((value) => {
      if (value.value !== 'NULL') {
        params[value.textContent] = value.value;
      }
    });
    return params;
  }, '#ctl00_phContents_ucSylSearchuc_ddl_grad > option');

  const opens: {
    [key: string]: string;
  } = await page.evaluate((selector) => {
    const params: { [key: string]: string } = {};
    document.querySelectorAll(selector).forEach((value) => {
      if (value.value !== 'NULL') {
        params[value.textContent] = value.value;
      }
    });
    return params;
  }, '#ctl00_phContents_ucSylSearchuc_ddl_open > option');

  const days: {
    [key: string]: string;
  } = await page.evaluate((selector) => {
    const params: { [key: string]: string } = {};
    document.querySelectorAll(selector).forEach((value) => {
      if (value.value !== '-1') {
        params[value.textContent] = value.value;
      }
    });
    return params;
  }, '#ctl00_phContents_ucSylSearchuc_ddl_day_ddl_ddl > option');

  const times: {
    [key: string]: string;
  } = await page.evaluate((selector) => {
    const params: { [key: string]: string } = {};
    document.querySelectorAll(selector).forEach((value) => {
      if (value.value !== 'NULL') {
        params[value.textContent] = value.value;
      }
    });
    return params;
  }, '#ctl00_phContents_ucSylSearchuc_ddl_time > option');

  fs.writeFileSync('src/params/year.json', JSON.stringify(years));
  fs.writeFileSync('src/params/org.json', JSON.stringify(orgs));
  fs.writeFileSync('src/params/fac.json', JSON.stringify(facs));
  fs.writeFileSync('src/params/grad.json', JSON.stringify(grads));
  fs.writeFileSync('src/params/open.json', JSON.stringify(opens));
  fs.writeFileSync('src/params/day.json', JSON.stringify(days));
  fs.writeFileSync('src/params/time.json', JSON.stringify(times));
};

export default fetchParams;
