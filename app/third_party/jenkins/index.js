const qs = require('querystring');
const Url = require('url');


const {
  getBaseUrl, sleep, get, post, parseString,
} = require('./helpers');


class Jenkins {
  constructor(id, token, path, customHeaders = {}) {
    this.token = token;
    this.baseUrl = getBaseUrl(id, token, path);
    this.urlParams = { token };
    this.headers = Object.assign({}, { Authorization: this.urlParams.token }, customHeaders);
    this.crumb = null;
  }

  async info(job = null) {
    if (job) return get(...await this._getRequest(`${job}/api/json`));
    return get(...await this._getRequest('/api/json'));
  }

  async getJobInfo(job) {
    return get(...await this._getRequest(job));
  }

  async getBuildInfo(job, buildNumber) {
    return get(...await this._getRequest(job, buildNumber));
  }

  async getJobConfig(job) {
    const rawConfig = await get(...await this._getRequest(`${job}/config.xml`));
    return parseString(rawConfig);
  }

  async build(job) {
    const [url, headers] = await this._getRequest(job, '/build');
    // console.log(url);
    // console.log(headers);
    return post(url, null, headers);
  }

  async buildWithParams(job, params = {}) {
    const [url, headers] = await this._getRequest(job, '/buildWithParameters', params);
    return post(url, params, headers);
  }

  async progressiveText(job, id, showLogs = true, interval = 100) {
    let isBuilding = true;
    let offset = 0;
    let text = '';
    while (isBuilding) {
      try {
        const [url] = await this._getRequest(job, `/${id}/logText/progressiveText`);
        const result = await get(`${url}&start=${offset}`, this.headers, true);
        if (result.status === 404) throw new Error(404);
        const { data } = result;
        isBuilding = result.headers['x-more-data'];
        offset = result.headers['x-text-size'];
        text += data;
        if (data && showLogs) console.log(data); // eslint-disable-line
        await sleep(interval);
      } catch (e) {
        if (e.message !== '404') throw new Error(e);
      }
    }
    const lines = text.split('\n');
    return lines[lines.length - 2];
  }

  async _getCrumb() {
    const url = `${this.baseUrl}/crumbIssuer/api/json`;
    const result = await get(url, this.headers);
    this.crumb = result;
    return result;
  }

  async _getRequest(url, extra = '', params = null) {
    const urlObject = Url.parse(url);
    url = urlObject.pathname;

    if (!url.startsWith('/')) url = `/${url}`;
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (extra.length && !extra.startsWith('/')) extra = `/${extra}`;

    const endpoint = `${this.baseUrl}${url}${extra}`;
    const crumb = this.crumb || await this._getCrumb();
    const headers = Object.assign({}, this.headers, { [crumb.crumbRequestField]: crumb.crumb });

    return [`${endpoint}?${qs.stringify(this.urlParams)}${params ? `&${qs.stringify(params)}` : ''}`, { headers }];
  }

  toString() {
    return `<Jenkins ${this.token}>`;
  }
}

module.exports = Jenkins;
