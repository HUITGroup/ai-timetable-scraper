import fetch from 'node-fetch';
import LectureInfo from './models/lectureInfo';

const postSyllabus = async (json: LectureInfo) => {
  const postUrl = 'http://localhost:1323/api/lecture';
  const options = {
    method: 'POST',
    body: JSON.stringify(json),
    headers: { 'Content-Type': 'application/json' },
  };
  const res = await fetch(postUrl, options);
  return res;
};

export default postSyllabus;
