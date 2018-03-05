import { ImageProvider } from './../../providers/image/image';
import { Component } from '@angular/core';
import { NavController, NavParams, IonicPage, LoadingController } from 'ionic-angular';
import { TimeProvider } from './../../providers/time/time';
import { DatabaseProvider } from './../../providers/database/database';
import { StatusProvider } from '../../providers/status/status';
import { LocationProvider } from './../../providers/location/location';
import { IonicMultiCamera, Picture } from 'ionic-multi-camera';
import { ActionSheetController } from 'ionic-angular/components/action-sheet/action-sheet-controller';
import { ImagePicker } from '@ionic-native/image-picker';
import { LogProvider } from '../../providers/log/log';
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  long: any;
  lat: any;
  openMapLoading = this.loader.create({
    spinner: 'crescent',
    dismissOnPageChange: true
  });

  constructor(
    public navCtrl: NavController,
    private loader: LoadingController,
    public timeService: TimeProvider,
    public database: DatabaseProvider,
    public statusService: StatusProvider,
    private camera: IonicMultiCamera,
    private locationService: LocationProvider,
    private actionSheetCtrl: ActionSheetController,
    private imagePicker: ImagePicker,
    public imageService: ImageProvider,
    public log : LogProvider
  ) {
  }

  clockIn() {
    let a = this.createClockInOption();
    a.present();
  }

  browseGallery = () => {
    this.imagePicker.hasReadPermission().then(b => {
      if (b) this.getPicture();
      else this.imagePicker.requestReadPermission().then(res => {
        console.log(res);
      });
    }, e => console.log(e));
  }

  getPicture(){
    this.imagePicker.getPictures({
      quality: 40
    }).then(results => {
      if (results.length == 0) return;

      this.openMapLoading.present().then(() => {
        let temp = [];
        let c = 0;

        for (let i = 0; i < results.length; i++) {
          let data = this.imageService.extractPathAndFile(results[i]);
          console.log('data: ', data);
          
          this.imageService.urlToB64(data.path, data.file).then(b64 => {
            let name = results[i].split('/');
            name = name[name.length - 1];
            temp.push({
              fileEntry: {
                name: name
              },
              base64Data: b64,
              normalizedURL: results[i]
            });
            if (++c == results.length) {
              this.database.photos = temp;
              this.navCtrl.setRoot('MapViewPage')
            }
          }).catch(e => console.log(e));
        }
      });
    }, e => console.log(e));
  }

  takePicture = () => {
    this.camera.getPicture().then((pictures: Array<Picture>) => {
      if(pictures.length < 0) return;
      this.openMapLoading.present().then(() => {
        let temp = [];
        pictures.forEach(photo => {
            photo.base64Data = 'data:image/jpeg;base64,' + photo.base64Data;
            temp.push(photo);
        });
        this.database.photos = temp;
        this.navCtrl.setRoot('MapViewPage');
      })
    }).catch(e => {
      console.log(e);
    });
  }

  createClockInOption() {
    return this.actionSheetCtrl.create({
      title: 'Clock In',
      buttons: [
        {
          text: 'Browse Gallery',
          handler: this.browseGallery
        },
        {
          text: 'Take Pictures',
          handler: this.takePicture
        }
      ]
    });
  }

  ionViewDidLeave () {
    this.log.all_log = this.log.logs;
  }

  ionViewCanEnter () {
    //retreive all logs
    this.log.logs = this.log.all_log;
  }
}