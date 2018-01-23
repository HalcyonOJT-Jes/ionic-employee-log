import { DatabaseProvider } from './../../providers/database/database';
import { TimeProvider } from './../../providers/time/time';
import { LocationProvider } from './../../providers/location/location';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { EmployeesProvider } from '../../providers/employees/employees';
import { Observable } from 'rxjs/Observable';
import { BatteryProvider } from '../../providers/battery/battery';
import { AlertController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html',
})
export class MenuPage {
  base64Image: string;
  message: string;
  time: any;
  rows: any;
  sendLoading = this.loader.create({
    spinner: 'crescent',
    content: 'Uploading your Log in',
    dismissOnPageChange: true
  });

  openMapLoading = this.loader.create({
    spinner: 'crescent',
    dismissOnPageChange: true
  });

  alert = this.alertCtrl.create({
    title: 'Success!',
    subTitle: 'You have successfully logged in.',
    buttons: [{
      text : 'Ok',
      handler: () => {
        this.navCtrl.setRoot('HomePage', {
          success: true
        });
      }
    }]
  });

  options: CameraOptions = {
    destinationType: this.camera.DestinationType.DATA_URL,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE,
    cameraDirection: 1
  }

  constructor(public alertCtrl: AlertController, public navCtrl: NavController, public navParams: NavParams, private socket: Socket, private camera: Camera, public employeeId: EmployeesProvider, public locationService: LocationProvider, public timeService: TimeProvider, public database: DatabaseProvider, private loader: LoadingController, public batteryService: BatteryProvider) {
    this.socket.on('sv-successTimeIn', (data) => {
      if (data.success) {
        this.sendLoading.dismiss().then(() => {
          this.alert.present();
        });
      }
    });

    this.base64Image = this.navParams.get('b64');
  }

  openCamera() {
    this.camera.getPicture(this.options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      this.base64Image = 'data:image/jpeg;base64,' + imageData;
      //show loading
      this.openMapLoading.present().then(() => {
        //confirm locaiton
        this.navCtrl.push('MapViewPage', {
          lat: this.locationService.lat,
          long: this.locationService.long,
          b64: this.base64Image
        });
      });
    }, (err) => {
      console.log(err);
    });
  }

  send() {
    //show loader
    this.sendLoading.present();
    let t = Math.floor(Date.now() / 1000);

    //save log to local database
    this.database.db.executeSql('insert into log(time, month, lat, long, location, battery) VALUES(' + t + ', ' + this.timeService.getCurMonth() + ', ' + this.locationService.lat + ', ' + this.locationService.long + ', "' + this.locationService.location + '",' + this.batteryService.currBattery + ')', {}).then(() => {
      console.log('log added');
      
      //send log to server
      this.socket.emit('cl-timeIn', {
        employeeId: this.employeeId.currentId,
        timeIn: t,
        pic: this.base64Image,
        map: {
          lng: this.locationService.long,
          lat: this.locationService.lat
        },
        batteryStatus: this.batteryService.currBattery,
        msg: this.message,
      });
    }).catch(e => {
      console.log(e);
    });
  }

  ionViewDidLoad() {
    if (!this.base64Image) this.openCamera();
  }
}