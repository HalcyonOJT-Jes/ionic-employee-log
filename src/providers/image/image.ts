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
    public http     : HttpClient, 
    public file     : File,
    private base64  : Base64
  ) {
    console.log('Hello ImageProvider Provider');
  }

  blobToB64(url) {
    return new Promise((resolve, reject) => {
      this.base64.encodeFile(url).then((b64File: string) => {
        let b = b64File.split(';');
        let b64 = 'data:image/png;base64,' + b[2].split(",")[1];
        resolve(b64);
      }).catch(e => {
        reject(e);
      });
    });
  }

  b64toBlob(b64Data, contentType) {
    return new Promise((resolve, reject) => {
      contentType = contentType || '';
      let sliceSize = 512;

      let byteCharacters = atob(b64Data);
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
    return new Promise((resolve, reject) => {
      let pictureDir = this.file.externalDataDirectory;

      this.b64toBlob(base64, 'image/png').then((blob: any) => {
        this.file.writeFile(pictureDir, name + ".png", blob).then(() => {
          resolve(pictureDir + name + ".png");
        }).catch(e => {
          console.log('e: ', e);
        })
      }).catch(e => {
        console.log(e);
      });
    });
  }
}
