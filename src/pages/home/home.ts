import { ImageProvider } from './../../providers/image/image';
import { Component } from '@angular/core';
import { NavController, NavParams, IonicPage, LoadingController } from 'ionic-angular';
import { TimeProvider } from './../../providers/time/time';
import { LogProvider } from './../../providers/log/log';
import { DatabaseProvider } from './../../providers/database/database';
import { StatusProvider } from '../../providers/status/status';
import { LocationProvider } from './../../providers/location/location';
import { IonicMultiCamera, Picture } from 'ionic-multi-camera';
import { ActionSheetController } from 'ionic-angular/components/action-sheet/action-sheet-controller';
import { ImagePicker } from '@ionic-native/image-picker';


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
    public log: LogProvider,
    public timeService: TimeProvider,
    public database: DatabaseProvider,
    public statusService: StatusProvider,
    private camera: IonicMultiCamera,
    private locationService: LocationProvider,
    private actionSheetCtrl: ActionSheetController,
    private imagePicker: ImagePicker,
    public imageService: ImageProvider
  ) {
  }

  clockIn() {
    let a = this.createClockInOption();
    a.present();
  }

  createClockInOption() {
    return this.actionSheetCtrl.create({
      title: 'Clock In',
      buttons: [
        {
          text: 'Browse Gallery',
          handler: () => {
            this.imagePicker.hasReadPermission().then(b => {
              if (b) {
                this.imagePicker.getPictures({
                  quality: 80
                }).then(results => {
                  if (results.length == 0) {
                    console.log("no image");
                    return;
                  }

                  this.openMapLoading.present().then(() => {
                    let temp = [];
                    let c = 0;

                    for (let i = 0; i < results.length; i++) {
                      let data = this.imageService.extractPathAndFile(results[i]);
                      
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
              } else this.imagePicker.requestReadPermission();
            }, e => console.log(e));
          }
        },
        {
          text: 'Take Pictures',
          handler: () => {
            this.camera.getPicture().then((pictures: Array<Picture>) => {
              this.openMapLoading.present().then(() => {
                let temp = [];
                pictures.forEach(photo => {
                    photo.base64Data = 'data:image/jpeg;base64,' + photo.base64Data;
                    temp.push(photo);
                });
                this.database.photos = temp;
                this.navCtrl.push('MapViewPage');
              })
            }).catch(e => {
              console.log(e);
            });
          }
        }
      ]
    });
  }
}