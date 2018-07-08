# react-native-uservoice
A react-native sdk of the v1 api of UserVoice. This implementation only has little functionality for now and would be happy to receive many pull-requests.

[![npm version](https://img.shields.io/npm/v/react-native-uservoice.svg?style=flat-square)](https://www.npmjs.com/package/react-native-uservoice)
[![npm downloads](https://img.shields.io/npm/dm/react-native-uservoice.svg?style=flat-square)](https://www.npmjs.com/package/react-native-uservoice)

## Installation

Install in your application directory:

```
npm install --save react-native-uservoice
```

or

```
yarn add react-native-uservoice
```

## Usage
For example
```js
     let clientUserVoice = await clientProvider({
      apiKey: 'xxxxxx',
      apiSecret: 'xxxxxx',
      subdomain: 'xxxxx',
    });
    clientUserVoice = await clientUserVoice.withoutLogin();
    const list = await clientUserVoice.topicService.list();
```

Example redux-saga

```js
    let clientUserVoice = yield call(clientProvider, {
      apiKey: xxxxx,
      apiSecret: xxxx,
      subdomain: xxxx,
      wrapperFetch // Your custom implementation fetch
    });
    clientUserVoice = yield call([clientUserVoice, clientUserVoice.withoutLogin]);
    const list = yield call([clientUserVoice.topicService, clientUserVoice.topicService.list]);
```

