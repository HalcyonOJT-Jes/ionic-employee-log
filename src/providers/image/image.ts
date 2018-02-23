import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';
import { Base64 } from '@ionic-native/base64';

/*
  Generated class for the ImageProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ImageProvider {
  constructor(
    public http: HttpClient,
    public file: File,
    private base64: Base64
  ) {
    console.log('Hello ImageProvider Provider');
  }

  //for online image
  onlineUrlToB64(url) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        let canvas = <HTMLCanvasElement>document.createElement('CANVAS'),
          ctx = canvas.getContext('2d'),
          dataURL;
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);

        dataURL = canvas.toDataURL('jpeg');
        canvas = null;
        resolve(dataURL);
      };
      img.src = url;
    });
  }

  //for local image(blob/data uri)
  urlToB64(path, file) {
    //returns b64 string
    return this.file.readAsDataURL(path, file);
  }

  //requires clean b64 data (no mime type)
  b64toBlob(b64Data, contentType) {
    return new Promise((resolve, reject) => {
      contentType = contentType || '';
      let sliceSize = 512;
      let realData = b64Data.split(';')[1].split(',')[1];

      let byteCharacters = atob(realData);
      let byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        let slice = byteCharacters.slice(offset, offset + sliceSize);
        let byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        let byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
        if ((offset + sliceSize) >= byteCharacters.length) resolve(new Blob(byteArrays, { type: contentType }));
      }
    })
  }

  saveBase64(base64: string, name: string) {
    let pictureDir = this.file.externalDataDirectory;
    let fileName = name + ".jpeg";
    let fullDir = pictureDir + fileName;
    return this.b64toBlob(base64, 'image/jpeg').then((blob: any) => {
      return this.imageExists(pictureDir, fileName).then(() => {
        return fullDir;
      }).catch(() => {
        return this.file.writeFile(pictureDir, fileName, blob).then(() => {
          return fullDir;
        }).catch(e => {
          return fullDir;
        })
      })
    }).catch(e => console.log(e))
  }

  extractPathAndFile(dir) {
    let a = dir.lastIndexOf('/');
    let file = dir.substring(a + 1, dir.length).replace('%20', ' ');
    let path = dir.substring(0, a);
    return {
      file: file,
      path: path
    }
  }

  imageExists(dir, file) {
    return this.file.checkDir(dir, file);
  }
}
