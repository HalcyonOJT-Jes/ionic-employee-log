import { SafeResourcePipe } from './../../pipes/safe-resource/safe-resource';
import { SocketProvider } from './../../providers/socket/socket';
import { File } from '@ionic-native/file';
import { ConnectionProvider } from './../../providers/connection/connection';
import { LogProvider } from './../../providers/log/log';
import { DatabaseProvider } from './../../providers/database/database';
import { TimeProvider } from './../../providers/time/time';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { EmployeesProvider } from '../../providers/employees/employees';
import { BatteryProvider } from '../../providers/battery/battery';
import { AlertController } from 'ionic-angular';
import { LocationProvider } from '../../providers/location/location';
import { IonicMultiCamera, Picture } from 'ionic-multi-camera';
import { ImageProvider } from '../../providers/image/image';


@IonicPage()
@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html'
})
export class MenuPage {
  message: string;
  time: any;
  rows: any;
  scanResult: string;

  openMapLoading = this.loader.create({
    spinner: 'crescent',
    dismissOnPageChange: true
  });

  sendLoading = this.loader.create({
    spinner: 'crescent',
    content: 'Uploading your Log in',
    dismissOnPageChange: true
  });

  alert = this.alertCtrl.create({
    title: 'Success!',
    subTitle: 'You have successfully logged in.',
    buttons: [{
      text: 'Ok',
      handler: () => {
        this.navCtrl.setRoot('HomePage', {
          success: true
        });
      }
    }]
  });

  constructor(
    private navParams: NavParams,
    private file: File,
    private connectionService: ConnectionProvider,
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    public employeeId: EmployeesProvider,
    public locationService: LocationProvider,
    public timeService: TimeProvider,
    public database: DatabaseProvider,
    private loader: LoadingController,
    public batteryService: BatteryProvider,
    private logService: LogProvider,
    private socketService: SocketProvider,
    public camera: IonicMultiCamera,
    public imageService: ImageProvider
  ) {
    this.scanResult = this.navParams.get('scanResult');
  }

  send() {
    //show loader
    if (this.connectionService.connection) this.sendLoading.present();
    else this.sendLoading.setContent("Can't connect to server. Saving to local.").present();

    let t = this.timeService.curUnix;
    this.logService.saveLog(
      t,
      this.locationService.lat,
      this.locationService.long,
      this.locationService.location,
      this.batteryService.currBattery
    ).then(logId => {
      return this.saveLogImages(logId);
    }).then(() => {
      let images = this.database.photos.map((photo) => {
        return Promise.resolve(photo.base64Data);
      });

      Promise.all(images).then((imgs) => {
        //send or keep log
        if (this.connectionService.connection) {
          console.log("sending to server");
          //send log to server
          this.socketService.socket.emit('cl-timeIn', {
            employeeId: this.employeeId.currentId,
            timeIn: t,
            pics: imgs,
            map: {
              lng: this.locationService.long,
              lat: this.locationService.lat
            },
            batteryStatus: this.batteryService.currBattery,
            msg: this.message,
            scanResult: this.scanResult
          }, (data) => {
            let promises = this.database.photos.map((photo) => {
              let data = this.imageService.extractPathAndFile(photo.normalizedURL);
              return this.file.removeFile(data.path, data.file);
            });
            
            Promise.all(promises).then(() => {
              this.sendLoading.dismiss().then(() => {
                this.alert.present();
                this.logService.logEntry(data);
              });
            }).catch(e => console.log(e));
          });
        } else {
          this.sendLoading.dismiss().then(() => {
            this.alert.setSubTitle('Log saved to local.').present();
            let nm = {
              unix: this.timeService.curUnix,
              map: {
                formattedAddress: this.locationService.location
              },
              isSeen: false
            }
            this.logService.local_log.unshift(nm);
          })
        }
      }).catch(e => console.log(e))
    }).catch(e => console.log(e));
  }

  saveLogImages(logId) {
    return new Promise((resolve, reject) => {
      //create array of promises
      console.log(this.database.photos);
      let promise_array = this.database.photos.map((photo) => {
        return this.imageService.saveBase64(photo.base64Data, photo.fileEntry.name.replace(/.jpeg|.png|.gif/gi, '')).then((filename) => {
          ;
          return this.database.db.executeSql('insert into log_images(logId, file) values(' + logId + ', "' + filename + '")', {}).then(() => {
          }).catch(e => console.log(e));
        }).catch(e => console.log(e));
      });

      Promise.all(promise_array).then((a) => {
        console.log("saved all images");
        this.database.getLastInsert("log").then((id: number) => {
          let lastInsertedId: number;
          if (id > 0) lastInsertedId = id;
          else console.error('No log with logId : ' + lastInsertedId);

          this.database.db.executeSql('update log set pic = ' + lastInsertedId + ' where id = ' + logId, {}).then(() => {
            console.log("updated log table : saved log_image id to log");
            resolve();
          }).catch(e => console.log(e))
        });
      }).catch(e => console.log(e));
    })
  }

  closeMenu() {
    this.navCtrl.setRoot('HomePage');
  }

  openCamera() {
    this.camera.getPicture().then((pictures: Array<Picture>) => {
      this.database.photos = pictures;
      this.openMapLoading.present().then(() => {
        this.navCtrl.push('MapViewPage');
      })
    }).catch(e => {
      console.log(e);
    });
  }

  ionViewDidLeave() {
    this.scanResult = undefined;
  }
}