import { Client } from './client';

let instance;
export function clientProvider(clientOptions, oauthProvider) {
  if (!instance) {
    instance = new Client(clientOptions, oauthProvider);
  }
  return instance;
}
