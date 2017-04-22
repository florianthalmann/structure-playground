import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class FeatureService {

  private serverPath = 'http://localhost:4199/';

  constructor(private http: Http) { }

  getAudiofilePath(audiofile: string): Promise<string> {
    return this.httpGet('getaudiofilepath/', { 'audiofile': audiofile })
      .then(response => response._body)
      .catch(e => console.error(e));
  }

  getFeatureFilenames(audiofile: string): Promise<string[]> {
    return this.httpGet('getfeaturefiles/', { 'audiofile': audiofile })
      .then(response => response.json())
      .catch(e => console.error(e));
  }

  postFile(path: string, content: Object) {
    this.http.post(this.serverPath + 'saveOutFile/', {path:path, content:content})
      .toPromise()
      .then(response => console.log(response._body))
      .catch(e => console.error(e));
  }

  httpGet(uri: string, params: Object): Promise<any> {
    let searchParams: URLSearchParams = new URLSearchParams();
    Object.keys(params).forEach(k => searchParams.set(k, params[k]));
    return this.http.get(this.serverPath + uri, { search: searchParams })
      .toPromise()
      .catch(e => console.error(e));
  }

}