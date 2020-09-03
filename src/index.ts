import scrape from './scrapeSyllabus';

import scrapeSyllabus from './scrapeSyllabus.js';
import fetchParams from './fetchParams.js';

fetchParams().then(() => {
  process.exit(0);
});

//scrapeSyllabus();
//process.exit(0);
