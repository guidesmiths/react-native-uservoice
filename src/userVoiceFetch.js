/* eslint no-global-assign:0 */

//To capture request in react-native-debugger (browser)
const GLOBAL = global;
XMLHttpRequest = GLOBAL.originalXMLHttpRequest ? GLOBAL.originalXMLHttpRequest :
  GLOBAL.XMLHttpRequest;


export default ({ url, method = 'POST', header, body, wrapperFetch }) =>
  new Promise((resolve, reject) => {
    const myHeaders = new Headers(header);

    const configReq = {
      method,
      headers: myHeaders
    };

    if (body) {
      configReq.body = body;
    }

    if (wrapperFetch) wrapperFetch({ url, configReq, resolve, reject });
    else {
      fetch(url, configReq)
        .then(response => {
          if (response.ok) {
            if (response.status === 204 || response.status === 201) {
              resolve();
            } else {
              response.json().then(resolve).catch(reject);
            }
          } else {
            response.json()
              .then(errJson => reject({ status: response.status, json: errJson }))
              .catch(reject);
          }
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
