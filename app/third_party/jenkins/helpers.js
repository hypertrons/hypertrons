const Url = require('url');
const axios = require('axios');
const xml2js = require('xml2js');

const parser = new xml2js.Parser(xml2js.defaults['0.2']);


const getBaseUrl = (id, token, path) => {
  const url = Url.parse(path.startsWith('http') ? path : `http://${path}`);
  const protocol = url.protocol || 'http:';
  const host = url.hostname || url.pathname;
  const port = url.port ? `:${url.port}` : '';
  return `${protocol}//${id}:${token}@${host}${port}`;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const get = async (url, headers, raw = false) => {
  try {
    const result = await axios.get(url, headers);
    if (raw) return result;
    return result.data;
  } catch (e) {
    return e.response;
  }
};

const post = (url, params, headers) => {
  try {
    return axios.post(url, params, headers);
  } catch (e) {
    return e.response;
  }
};

const parseString = str => new Promise((resolve, reject) => parser.parseString(str, (err, res) => {
  if (err) return reject(err);
  return resolve(res);
}));

module.exports = {
  getBaseUrl,
  sleep,
  get,
  post,
  parseString,
};
