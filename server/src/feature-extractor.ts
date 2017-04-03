import * as fs from 'fs';
import * as async from 'async';
import { execute } from './util';

export class FeatureExtractor {

  constructor() {}

  extractFeatures(paths: string[], features: string[]): Promise<any> {
    return new Promise(resolve =>
      async.mapSeries(paths, (p, c) =>
        async.mapSeries(features, (f,c) => this.extractFeature(f, p, c), c),
      resolve)
    );
  }

  //extracts the given feature from the current audio file (currentPath) if it doesn't exist yet
  private extractFeature(feature, path, callback) {
    var audioFolder = path.slice(0, path.lastIndexOf('/')+1);
    var audioFilename = path.slice(path.lastIndexOf('/')+1);
    var featureOutPath = path.replace(path.slice(path.lastIndexOf('.')), '');
    var featureDestPath = audioFolder+(featureOutPath+'_').slice(path.lastIndexOf('/')+1) + feature.name + '.json';
    fs.stat(featureDestPath, function(err, stat) {
      if (err) { // only extract if file doesn't exist yet
        console.log('extracting '+feature.name+' for '+audioFilename);
        execute('sonic-annotator -d ' + feature.plugin + ' ' + path + ' -w jams', function(success) {
          if (success) {
            execute('mv '+featureOutPath+'.json '+featureDestPath, function(success) {
              callback();
            });
          }
        });
      } else {
        callback();
      }
    })
  }

}