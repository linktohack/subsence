// @flow
const _ = require('lodash');
const Promise = require('bluebird');

const rp = require('request-promise');
const cheerio = require('cheerio');
const JSZip = require('JSZip');

module.exports = {
  download: download
};

function load(uri) {
  const options = {
    uri: uri,
    transform: function (body) {
      return cheerio.load(body);
    }
  };

  return rp(options);
}

function download(imdbID, language) {
  return load(`http://www.imdb.com/title/${imdbID}`).then(function ($) {
    const header = $('h1[itemprop=name]').text();
    const spited = header.match(/(.*?)\s+\(([0-9]+)\)/);
    const name = spited[1];
    const year = spited[2];

    return Promise.all([name, year, load(`https://subscene.com/subtitles/title?q=${name}&l=`)]);
  }).then(_.spread(function (name, year, $) {
    const titles = $('div.title a');
    const match = _.find(titles, function (el) {
      return $(el).text() == `${name} (${year})`;
    });
    const link = 'https://subscene.com' + $(match).attr('href');
    return Promise.all([name, year, load(link)]);
  })).then(_.spread(function (name, year, $) {
    // const checked = $('a.imdb').attr('href') === `http://www.imdb.com/title/${imdbID}`
    const subs = $('td.a1');
    const subsForLang = _.filter(subs, function (el) {
      return _.trim($(el).find('span.l.r').text()) === language;
    });
    const positiveSubs = _.filter(subsForLang, function (el) {
      return $(el).find('span.l.r.positive-icon').length > 0;
    });
    const urls = _.map(positiveSubs.length > 0 ? positiveSubs : subsForLang, function (el) {
      return 'https://subscene.com' + $(el).find('a').attr('href');
    });

    return load(_.first(urls));
  })).then(function ($) {
    const link = 'https://subscene.com' + $('div.download a').attr('href');
    return rp({ uri: link, encoding: null });
  }).then(function (body) {
    return new JSZip().loadAsync(body).then(function (zip) {
      return _(zip.files).map().first().async('string');
    });
  });
}