import * as fs from 'fs';

export class FileManager {

  constructor(private inFolder: string, private outFolder: string, private rootPath: string,
    private serverPath: string = rootPath) {
    }

  getAudioFilePath(audioFile: string): string {
    return this.serverPath + this.toFolderName(audioFile) + audioFile;
  }

  getFeatureFiles(audioFile: string): Promise<string[]> {
    var folder = this.toFolderName(audioFile);
    return this.getFilesInFolder(folder, ["json", "n3"])
      .then(files => files.map(f => this.serverPath + folder + f));
  }

  saveOutFile(filePath: string, content: string): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.rootPath + this.outFolder + filePath, content, function (err) {
        if (err) return reject(err);
        resolve('file saved at ' + filePath);
      });
    });
  }

  private toFolderName(audioFilename) {
    return this.inFolder + audioFilename.replace('.', '_') + '/';
  }

  private getFilesInFolder(folder, fileTypes): Promise<string[]> {
    return new Promise(resolve => {
      fs.readdir(this.rootPath + folder, (err, files) => {
        if (err) {
          console.log(err);
        } else if (files) {
          var files = files.filter(f =>
            //check if right extension
            fileTypes.indexOf(f.split('.').slice(-1)[0]) >= 0
          );
        }
        resolve(files);
      });
    });
  }

}