// @flow
const sub = require('./lib/sub');

const imdbID = 'tt1355644';
const language = 'Vietnamese';

sub.download(imdbID, language).then(console.log.bind(console));
