/* eslint-disable */
import querystring from 'query-string';

import { OAuth } from './oauth';
import { DateParser } from './dateParser';

import { TopicService } from "./services/topicService";
import { ArticleService } from "./services/articleService";

export class Client {
  topicService = new TopicService(this);
  articleService = new ArticleService(this);
  constructor(clientOptions, oauthProvider) {
    this.clientOptions = clientOptions;
    this.baseUrl = `https://${this.clientOptions.subdomain}.${this.clientOptions.domain || 'uservoice.com'}/api/v1/`;
    this.requestOptions = this._mergeOptions(clientOptions.options);
    this.consumer = (oauthProvider ? oauthProvider : OAuth(this.baseUrl, clientOptions.apiKey, clientOptions.apiSecret, '1.0A', 'HMAC-SHA1', this.clientOptions.wrapperFetch));
  }
  // TODO: is incomplete
  loginAs(email) {
    return this.getRequestToken()
      .then(oauth_token => this.post('users/login_as.json', {
        request_token: oauth_token,
        user: { email: email }
      }))
      .then(response => this._loginWithAccessToken(response.token.oauth_token, response.token.oauth_token_secret));
  }

  loginAsOwner() {
    return this.getRequestToken()
      .then((oauth_token) => this.post('users/login_as_owner.json', { request_token: oauth_token})
        .then(response => this._loginWithAccessToken(response.token.oauth_token, response.token.oauth_token_secret))
      );
  }

  withoutLogin() {
    return this.getRequestToken()
      .then(oauth_token => this._withoutLoginWithAccessToken(oauth_token));
  }

  _loginWithAccessToken(token, secret) {
    let clonedOptions = this._clone(this.clientOptions);
    clonedOptions.accessToken = token;
    clonedOptions.accessSecret = secret;
    return new Client(clonedOptions, this.consumer);
  }

  _withoutLoginWithAccessToken(token) {
    let clonedOptions = this._clone(this.clientOptions);
    clonedOptions.accessToken = token;
    return new Client(clonedOptions, this.consumer);
  }

  get(endpoint, data = {}) {
    data = DateParser().processDates(data);

    let url = this.baseUrl + endpoint;
    if (data) {
      url = `${url}?${querystring.stringify(data)}`;
    }

    return this.consumer.get(url, this._getAccessToken(), this._getAccessSecret());
  }

  post(endpoint, data = {}) {
    data = DateParser().processDates(data);

    return this.consumer.post(this.baseUrl + endpoint, this._getAccessToken(), this._getAccessSecret(), JSON.stringify(data), 'application/json');
  }

  put(endpoint, data = {}) {
    data = DateParser().processDates(data);

    return this.consumer.put(this.baseUrl + endpoint, this._getAccessToken(), this._getAccessSecret(), JSON.stringify(data), 'application/json');
  }

  deletes(endpoint) {
    return this.consumer.deletes(this.baseUrl + endpoint, this._getAccessToken(), this._getAccessSecret());
  }

  _getAccessToken() { return this.clientOptions ? this.clientOptions.accessToken : ''; }

  _getAccessSecret() { return this.clientOptions ? this.clientOptions.accessSecret : ''; }

  getRequestToken() {
    return new Promise((resolve, reject) => {
      this.consumer.getOAuthRequestToken()
        .then(response => resolve(response.token.oauth_token))
        .catch(reject);
    });
  }

  _mergeOptions(options = {}) {
    options.pagination = options.pagination || {};
    options.pagination.max = options.pagination.max || 500;
    return options;
  }

  _clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  };
}
