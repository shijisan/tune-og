import 'react-native-url-polyfill/auto';

if (typeof global.EventTarget === 'undefined') {
  const { EventTarget } = require('event-target-shim');
  // @ts-ignore
  global.EventTarget = EventTarget;
}

if (typeof global.AbortController === 'undefined') {
  const { AbortController } = require('abort-controller');
  // @ts-ignore
  global.AbortController = AbortController;
}
