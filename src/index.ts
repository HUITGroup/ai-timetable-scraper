import scrapeSyllabus from './scrapeSyllabus.js';
import fetchParams from './fetchParams.js';
import postSyllabus from './postSyllabus.js';

/*
fetchParams().then(() => 
  process.exit(0));
*/

const main = async () => {
  const lectureInfoList = await scrapeSyllabus();
  for (const lectureInfo of lectureInfoList) {
    await postSyllabus(lectureInfo);
  }

  process.exit(0);
};

main();
