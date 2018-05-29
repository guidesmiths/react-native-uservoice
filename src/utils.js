/*eslint guard-for-in: 0, prefer-const: 0, no-nested-ternary: 0,
 no-restricted-syntax: 0, no-prototype-builtins: 0, no-useless-escape: 0*/

import URLparse from 'url-parse';
import CryptoJS from 'crypto-js';

export const NONCE_CHARS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
  'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B',
  'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
  'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3',
  '4', '5', '6', '7', '8', '9'];

export const encodeData = (toEncode) =>
  toEncode && encodeURIComponent(toEncode)
    .replace(/\!/g, '%21')
    .replace(/\'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');

export const decodeData = (toDecode) => (toDecode !== null ?
  decodeURIComponent(toDecode) : decodeURIComponent(toDecode.replace(/\+/g, ' ')));

export const createSignatureBase = (method, url, parameters) =>
  method.toUpperCase() + '&' + encodeData(normalizeUrl(url)) + '&' + encodeData(parameters);

export const createSignature = (consumerSecret, signatureMethod, signatureBase, tokenSecret) => {
  if (!tokenSecret) tokenSecret = '';
  else tokenSecret = encodeData(tokenSecret);
  // consumerSecret is already encoded
  const key = consumerSecret + '&' + tokenSecret;

  let hash = '';
  if (signatureMethod === 'PLAINTEXT') {
    hash = key;
  } else if (signatureMethod === 'HMAC-SHA1') {
    hash = CryptoJS.HmacSHA1(signatureBase, key).toString(CryptoJS.enc.Base64);
  }
  return hash;
};

export const getNonce = (nonceSize) => NONCE_CHARS.slice(0, nonceSize).map(() =>
  NONCE_CHARS[Math.floor(Math.random() * NONCE_CHARS.length)]).join('');

export const getTimestamp = () => Math.floor((new Date()).getTime() / 1000);

export const getSignature = (consumerSecret, signatureMethod,
                             method, url, parameters, tokenSecret) =>
  createSignature(consumerSecret, signatureMethod, createSignatureBase(method, url, parameters),
    tokenSecret);

// Takes an object literal that represents the arguments, and returns an array
// of argument/value pairs.
export const makeArrayOfArgumentsHash = (argumentsHash) => {
  let argumentPairs = [];
  for (let key in argumentsHash) {
    if (argumentsHash.hasOwnProperty(key)) {
      const value = argumentsHash[key];
      if (Array.isArray(value)) {
        value.forEach((val) => (argumentPairs[argumentPairs.length] = [key, val]));
      } else {
        argumentPairs[argumentPairs.length] = [key, value];
      }
    }
  }
  return argumentPairs;
};

export const sortRequestParams = (argumentPairs) =>
  argumentPairs.sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : (a[0] < b[0] ? -1 : 1)));

export const normaliseRequestParams = (args) => {
  let argumentPairs = makeArrayOfArgumentsHash(args);
  // First encode them #3.4.1.3.2 .1
  argumentPairs.forEach((pair) =>
    (pair[0] = encodeData(pair[0])) && (pair[1] = encodeData(pair[1])));

  // Then sort them #3.4.1.3.2 .2
  argumentPairs = sortRequestParams(argumentPairs);

  // Then concatenate together #3.4.1.3.2 .3 & .4
  args = '';
  argumentPairs.forEach((pair, i) =>
    (args += `${pair[0]}=${pair[1]}${(i < argumentPairs.length - 1 ? '&' : '')}`));

  return args;
};

export const normalizeUrl = (url) => {
  const parsedUrl = URLparse(url, true);
  let port = '';
  if (parsedUrl.port) {
    if ((parsedUrl.protocol === 'http:' && parsedUrl.port !== '80') ||
      (parsedUrl.protocol === 'https:' && parsedUrl.port !== '443')) {
      port = ':' + parsedUrl.port;
    }
  }

  if (!parsedUrl.pathname || parsedUrl.pathname === '') parsedUrl.pathname = '/';

  return parsedUrl.protocol + '//' + parsedUrl.hostname + port + parsedUrl.pathname;
};
