import scrapeSyllabus from './scrapeSyllabus.js';
import fetchParams from './fetchParams.js';
import postSyllabus from './postSyllabus.js';
import LectureInfo from './models/lectureInfo.js';

/*
fetchParams().then(() => 
  process.exit(0));
*/

scrapeSyllabus().then((json) => {
  postSyllabus(json[0]).then(() => {
    process.exit(0);
  });
});
