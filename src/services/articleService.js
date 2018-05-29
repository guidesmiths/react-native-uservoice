/*eslint no-useless-constructor: 0 */
import { ApiService } from './apiService';

export class ArticleService extends ApiService {
  constructor(client) {
    super(client);
  }

  list(topicId, options = {}) {
    options.per_page = options.per_page || this.client.requestOptions.pagination.max;
    return this.client.get(`topics/${topicId}/articles.json`, options);
  }

  listAll(options = {}) {
    options.per_page = options.per_page || this.client.requestOptions.pagination.max;
    return this.client.get('articles.json', options);
  }
}
