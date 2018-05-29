/*eslint operator-assignment: 0, guard-for-in: 0, prefer-const: 0, no-nested-ternary: 0,
 no-restricted-syntax: 0, no-prototype-builtins: 0, no-useless-escape: 0, no-unused-vars: 0 */

import URLparse from 'url-parse';
import querystring from 'query-string';
import { Buffer } from 'buffer';

import userVoiceFetch from './userVoiceFetch';

import {
  encodeData, getNonce, getSignature, getTimestamp, makeArrayOfArgumentsHash,
  normaliseRequestParams, sortRequestParams
} from './utils';

export function OAuth(baseUrl, consumerKey, consumerSecret, version, signatureMethod, nonceSize = null, wrapperFetch = null) {
  const requestUrl = `${baseUrl}oauth/request_token.json`;
  const accessUrl = `${baseUrl}oauth/access_token.json`;

  consumerSecret = encodeData(consumerSecret);

  const authorizeCallback = 'oob';
  nonceSize = nonceSize | 32;

  let headers = {
    'Accept': '*/*',
    'Connection': 'close',
    'User-Agent': 'Node authentication'
  };
  let clientOptions;
  let defaultClientOptions;
  clientOptions = defaultClientOptions = {
    'requestTokenHttpMethod': 'POST',
    'accessTokenHttpMethod': 'POST',
    'followRedirects': true
  };
  let oauthParameterSeperator = ',';

  function get(url, oauthToken, oauthTokenSecret) {
    return performSecureRequest(oauthToken, oauthTokenSecret, 'GET', url, null, '', null);
  }

  function deletes(url, oauthToken, oauthTokenSecret) {
    return performSecureRequest(oauthToken, oauthTokenSecret, 'DELETE', url, null, '', null);
  }

  function putOrPost(method, url, oauthToken, oauthTokenSecret, postBody, postContentType) {
    let extraParams = null;

    if (typeof postBody !== 'string' && !Buffer.isBuffer(postBody)) {
      postContentType = 'application/x-www-form-urlencoded';
      extraParams = postBody;
      postBody = null;
    }
    return performSecureRequest(oauthToken, oauthTokenSecret,
      method, url, extraParams, postBody, postContentType);
  }

  function post(url, oauthToken, oauthTokenSecret, postBody, postContentType) {
    return putOrPost('POST', url, oauthToken, oauthTokenSecret, postBody, postContentType);
  }

  function put(url, oauthToken, oauthTokenSecret, postBody, postContentType) {
    return putOrPost('PUT', url, oauthToken, oauthTokenSecret, postBody, postContentType);
  }

  function
  prepareParameters(oauthToken, oauthTokenSecret, method, url, extraParams) {
    let oauthParameters = {
      'oauth_timestamp': getTimestamp(),
      'oauth_nonce': getNonce(nonceSize),
      'oauth_version': version,
      'oauth_signature_method': signatureMethod,
      'oauth_consumer_key': consumerKey
    };

    oauthToken && (oauthParameters['oauth_token'] = oauthToken);

    extraParams && Object.keys(extraParams).forEach((key) =>
      extraParams.hasOwnProperty(key) && (oauthParameters[key] = extraParams[key]));

    const parsedUrl = URLparse(url, false);

    if (parsedUrl.query) {
      const extraParameters = querystring.parse(parsedUrl.query);
      for (const key in extraParameters) {
        const value = extraParameters[key];
        if (typeof value === 'object') {
          // TODO: This probably should be recursive
          Object.keys(value).forEach((key2) =>
            (oauthParameters[key + '[' + key2 + ']'] = value[key2]));
        } else {
          oauthParameters[key] = value;
        }
      }
    }

    let sig = getSignature(consumerSecret, signatureMethod, method, url,
      normaliseRequestParams(oauthParameters), oauthTokenSecret);

    let orderedParameters = sortRequestParams(makeArrayOfArgumentsHash(oauthParameters));
    orderedParameters[orderedParameters.length] = ['oauth_signature', sig];
    return orderedParameters;
  }

  const isParameterNameAnOAuthParameter = (parameter) =>
    (parameter.match('^oauth_') && (parameter.match('^oauth_')[0] === 'oauth_'));

  function buildAuthorizationHeaders(orderedParameters) {
    let authHeader = 'OAuth ';

    orderedParameters.forEach((parameter) => {
      // Whilst the all the parameters should be included
      // within the signature, only the oauth_ arguments
      // should appear within the authorization header.
      if (isParameterNameAnOAuthParameter(parameter[0])) {
        authHeader += '' + encodeData(parameter[0])
          + '="' + encodeData(parameter[1]) + '"' + oauthParameterSeperator;
      }
    });

    authHeader = authHeader.substring(0, authHeader.length - oauthParameterSeperator.length);
    return authHeader;
  }

  function performSecureRequest(oauthToken, oauthTokenSecret,
                                method, url, extraParams, postBody,
                                postContentType) {
    let orderedParameters =
      prepareParameters(oauthToken, oauthTokenSecret, method, url, extraParams);

    if (!postContentType) postContentType = 'application/x-www-form-urlencoded';

    let parsedUrl = URLparse(url, false);

    let headersRequest = {};
    const authorization = buildAuthorizationHeaders(orderedParameters);

    headersRequest['Authorization'] = authorization;
    headersRequest['Host'] = parsedUrl.host;

    Object.keys(headers).forEach((key) => (headersRequest[key] = headers[key]));

    extraParams && Object.keys(extraParams).forEach((key) =>
      isParameterNameAnOAuthParameter(key) && delete extraParams[key]);

    // Fix the mismatch between the output of querystring.stringify() and this._encodeData()
    if ((method === 'POST' || method === 'PUT') && (postBody === null && extraParams !== null)) {
      postBody = querystring.stringify(extraParams)
        .replace(/\!/g, '%21')
        .replace(/\'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
    }

    if (postBody) {
      if (Buffer.isBuffer(postBody)) {
        headersRequest['Content-length'] = postBody.length;
      } else {
        headersRequest['Content-length'] = Buffer.byteLength(postBody);
      }
    } else {
      headersRequest['Content-length'] = 0;
    }

    headersRequest['Content-Type'] = postContentType;

    return userVoiceFetch({
      url, method, header: headersRequest, body: postBody, wrapperFetch });
  }

  function getOAuthRequestToken(extraParams) {
    if (!extraParams) {
      extraParams = {};
    }

    return performSecureRequest(null, null, clientOptions.requestTokenHttpMethod, requestUrl,
      extraParams, null);
  }

  return {
    get,
    deletes,
    post,
    put,
    getOAuthRequestToken
  };
}
