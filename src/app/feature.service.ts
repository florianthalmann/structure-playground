import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class FeatureService {

  private serverPath = 'http://localhost:4199/';

  constructor(private http: Http) { }

  getAudiofilePath(audiofile: string): Promise<string> {
    return this.httpGet('getaudiofilepath/', { 'audiofile': audiofile })
     .then(response => response._body);
  }

  getFeatureFilenames(audiofile: string): Promise<string[]> {
    return this.httpGet('getfeaturefiles/', { 'audiofile': audiofile })
      .then(response => response.json());
  }

  postFile(path: string, content: string) {
    this.http.post(this.serverPath + 'saveOutFile/', {path:path, content:content})
      .toPromise()
      .then(response => console.log(response._body))
      .catch(error => this.handleError(error));
  }

  httpGet(uri: string, params: Object): Promise<any> {
    let searchParams: URLSearchParams = new URLSearchParams();
    Object.keys(params).forEach(k => searchParams.set(k, params[k]));
    return this.http.get(this.serverPath + uri, { search: searchParams })
      .toPromise()
      .catch(error => this.handleError(error));
  }

  handleError(error) {
    console.error('An error occurred', error);
  }

}