import { SocketProvider } from './../../providers/socket/socket';
import { File } from '@ionic-native/file';
import { ConnectionProvider } from './../../providers/connection/connection';
import { LogProvider } from './../../providers/log/log';
import { DatabaseProvider } from './../../providers/database/database';
import { TimeProvider } from './../../providers/time/time';
import { Component } from '@angular/core';
import { IonicPage, NavController, LoadingController } from 'ionic-angular';
import { EmployeesProvider } from '../../providers/employees/employees';
import { BatteryProvider } from '../../providers/battery/battery';
import { AlertController } from 'ionic-angular';
import { LocationProvider } from '../../providers/location/location';

@IonicPage()
@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html',
})
export class MenuPage {
  message: string;
  time: any;
  rows: any;

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

  constructor(private file: File, private connectionService: ConnectionProvider, public alertCtrl: AlertController, public navCtrl: NavController, public employeeId: EmployeesProvider, public locationService: LocationProvider, public timeService: TimeProvider, public database: DatabaseProvider, private loader: LoadingController, public batteryService: BatteryProvider, private logService: LogProvider, private socketService : SocketProvider) {
    this.logService.logEntry().subscribe(() => {
      console.log("presented loading");
      this.sendLoading.dismiss().then(() => {
        this.alert.present();
      });
    });
  }

  send() {
    //show loader
    if (this.connectionService.connection) this.sendLoading.present();
    else this.sendLoading.setContent("Can't connect to server. Saving to local.").present();

    let t = Math.floor(Date.now() / 1000);

    //save image to gallery
    console.log('saving image');
    this.saveBase64(this.database.base64Image, this.employeeId.currentId + "_" + t).then((filename) => {
      console.log("IMAGE SAVED : " + filename);
      //save log to local database
      this.database.db.executeSql('insert into log(timeIn, month, lat, long, formattedAddress, batteryStatus, pic) VALUES(' + t + ', ' + this.timeService.getCurMonth() + ', ' + this.locationService.lat + ', ' + this.locationService.long + ', "' + this.locationService.location + '",' + this.batteryService.currBattery + ', "' + filename + '")', {}).then(() => {
        console.log('log added');

        if (this.connectionService.connection) {
          console.log("sending to server");
          //send log to server
          this.socketService.socket.emit('cl-timeIn', {
            employeeId: this.employeeId.currentId,
            timeIn: t,
            pic: this.database.base64Image,
            map: {
              lng: this.locationService.long,
              lat: this.locationService.lat
            },
            batteryStatus: this.batteryService.currBattery,
            msg: this.message,
          }, (res) => {
            console.log(res);
          });
        } else {
          this.sendLoading.dismiss().then(() => {
            this.alert.setSubTitle('Log saved to local.').present();
            let dt = this.timeService.getDateTime(t * 1000);
            let nm = {
              time : dt.time + " " + dt.am_pm,
              date: dt.date,
              map: {
                formattedAddress: this.locationService.location
              },
              isSeen: false
            }
            this.logService.local_log.unshift(nm);
          })
        }
      }).catch(e => {
        console.log(e);
      });
    });
  }

  b64toBlob(b64Data, contentType) {
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
    }

    let blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  saveBase64(base64: string, name: string) {
    return new Promise((resolve, reject) => {
      let pictureDir = this.file.externalDataDirectory;

      let block = base64.split(";");
      let dataType = block[0].split(":")[1];
      let realData = block[1].split(",")[1];
      let blob = this.b64toBlob(realData, 'image/png');

      this.file.writeFile(pictureDir, name + ".png", blob).then(() => {
        resolve(pictureDir + name + ".png");
      }).catch(e => {
        console.log(e);
        reject(e);
      });
    });
  }

  ionViewDidLoad() {
  }
}