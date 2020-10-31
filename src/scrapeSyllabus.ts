import puppeteer from 'puppeteer';
import fs from 'fs';
import LectureInfo from './models/lectureInfo';
import LectureBasicInfo from './models/lectureBasicInfo';
import LectureDetailInfo from './models/lectureDetailInfo';

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
  await page.select('#ctl00_phContents_ucSylSearchuc_ddl_fac', '25'); //工学部
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

  const basicInfoList: LectureBasicInfo[] = await page.evaluate(() => {
    const list: LectureBasicInfo[] = [];
    const maxLectures = 3; // 検証のため，取得数を一旦3つまでにした
    document
      .querySelectorAll('#ctl00_phContents_ucSylList_gv > tbody > tr')
      .forEach((row, idx) => {
        if (idx === 0) {
          return;
        }
        if (idx > maxLectures) {
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

        const days: { [key: string]: number } = {
          月: 0,
          火: 1,
          水: 2,
          木: 3,
          金: 4,
          土: 5,
          日: 6,
        };

        const eligibleGrades = colTexts[5].split('〜');

        const basicInfo: LectureBasicInfo = {
          semester: colTexts[1],
          day: colTexts[4] === '集中' ? -1 : days[colTexts[4][0]],
          period: colTexts[4] === '集中' ? -1 : Number(colTexts[4][1]),
          eligible_grade_bottom: Number(eligibleGrades[0]),
          eligible_grade_top: eligibleGrades[1]
            ? Number(eligibleGrades[1])
            : -1,
          instructor: colTexts[3],
        };
        list.push(basicInfo);
      });

    return list;
  });

  const detailInfoList: LectureDetailInfo[] = [];
  for (let i = 0; i < basicInfoList.length; i++) {
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
        timeout: 1000,
      }
    );

    const detailInfo = await newPage.evaluate(() => {
      const getText = (selector: string) => {
        const elem = document.querySelector(selector);
        return elem && elem.textContent ? elem.textContent : null;
      };

      const course_title =
        getText('#ctl00_phContents_ucSylDetail_ucSummary_lbl_sbj_name') || ' ';

      const subtitle =
        getText('#ctl00_phContents_ucSylDetail_ucSummary_lbl_theme_name') ||
        ' ';

      const year = Number(
        getText('#ctl00_phContents_ucSylDetail_ucSummary_lbl_lct_year')
      );

      const eligible_class =
        getText('#ctl00_phContents_ucSylDetail_ucSummary_lbl_class_name') || '';

      const credit = Number(
        getText('#ctl00_phContents_ucSylDetail_ucSummary_lbl_credits')
      );

      const lecture_type =
        getText('#ctl00_phContents_ucSylDetail_ucSummary_lbl_type_name') || '';

      const available_others =
        getText('#ctl00_phContents_ucSylDetail_ucSummary_lbl_other_fac') ===
        '可';

      const language =
        getText(
          '#ctl00_phContents_ucSylDetail_ucSummary_lbl_num_language_name'
        ) || '';

      const keywords =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentKeyWord_lblDetail'
        ) || '';

      const objectives =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentAim_lblDetail'
        ) || '';

      const goals =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentTarget_lblDetail'
        ) || '';

      const schedule =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentSchedule_lblDetail'
        ) || '';

      const homework =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentPrestudy_lblDetail'
        ) || '';

      const grading =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentGrading_lblDetail'
        ) || '';

      const requirements =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentExperience_Note_lblDetail'
        ) || '';

      const textbooks =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ucContentTextBooks_lblDetail'
        ) || '';

      const reading_list =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentReferenceBooks_lblDetail'
        ) || '';

      const websites =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentUrl_lblDetail'
        ) || '';

      const lab =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentWebsite_lblDetail'
        ) || '';

      const additional =
        getText(
          '#ctl00_phContents_ucSylDetail_ucContents_ContentNote_lblDetail'
        ) || '';

      const detail: LectureDetailInfo = {
        course_title,
        subtitle,
        year,
        eligible_class,
        credit,
        degree: '学士課程',
        faculty: '工学部',
        required_type: '選択科目',
        lecture_type,
        available_others,
        language,
        keywords,
        objectives,
        goals,
        schedule,
        homework,
        grading,
        requirements,
        textbooks,
        reading_list,
        websites,
        lab,
        additional,
      };
      return detail;
    });

    detailInfoList.push(detailInfo);

    await newPage.close();
  }

  const infoList: LectureInfo[] = [];
  basicInfoList.forEach((basicInfo, idx) => {
    infoList.push({ ...basicInfo, ...detailInfoList[idx] });
  });

  if (!fs.existsSync('output')) {
    fs.mkdirSync('output');
  }
  fs.writeFileSync(
    'output/lectureInfoList.json',
    JSON.stringify(infoList, null, 2)
  );

  return infoList;
};

export default scrapeSyllabus;
