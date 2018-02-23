import { Storage } from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';
import { Base64 } from '@ionic-native/base64';

@Injectable()
export class ImageProvider {

  constructor(
    public http     : HttpClient,
    public file     : File,
    private base64  : Base64,
    private storage : Storage
  ) {
    console.log('Hello ImageProvider Provider');
  }

  //check if admin image is updatable
  adminImageIsUpdated (newImageUrl) {
    this.storage.get('admin-image').then(fileUrl => {
      return this.extractPathAndFile(fileUrl);
    }).then(data => {
      this.imageExists(data.path, data.file)
      //exists
      .then(() => {
        if(newImageUrl == data.file) return true;
        return false;
      })
      //does not exists
      .catch(() => {
        return this.saveAdminImage(newImageUrl);
      }).catch(e => console.log(e));;
    })
  }

  //admin image
  saveAdminImage(url) {
    this.onlineUrlToB64(url).then((b64:string) => {
      let file = this.extractPathAndFile(url).file;
      return this.saveBase64(b64, file);
    }).then(fileUrl => {
      return this.storage.set('admin-image', fileUrl);
    }).then(() => {
      console.log('admin image saved.');
    });
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
  
  //for local
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
