/*eslint no-useless-constructor: 0 */
import { ApiService } from './apiService';

export class TopicService extends ApiService {
  constructor(client) {
    super(client);
  }

  list(options = {}) {
    options.per_page = options.per_page || this.client.requestOptions.pagination.max;
    return this.client.get('topics.json', options);
  }
}
