// @flow
const test = require('tape');
const sub = require('../lib/sub');

const imdbID = 'tt1355644';
const language = 'Vietnamese';

test('be able to download', function (t) {
  t.doesNotThrow(function () {
    return sub.download(imdbID, language);
  });
  t.end();
});

test('download the correct sub', function (t) {
  sub.download(imdbID, language).then(function (content) {
    if (/AVALON/.test(content)) {
      t.pass();
    } else {
      t.fail();
    }
  });
  t.end();
});