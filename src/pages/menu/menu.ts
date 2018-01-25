import { ConnectionProvider } from './../../providers/connection/connection';
import { LogProvider } from './../../providers/log/log';
import { DatabaseProvider } from './../../providers/database/database';
import { TimeProvider } from './../../providers/time/time';
import { Component } from '@angular/core';
import { IonicPage, NavController, LoadingController } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { EmployeesProvider } from '../../providers/employees/employees';
import { Observable } from 'rxjs/Observable';
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

  constructor(private connectionService: ConnectionProvider, public alertCtrl: AlertController, public navCtrl: NavController, private socket: Socket, public employeeId: EmployeesProvider, public locationService: LocationProvider, public timeService: TimeProvider, public database: DatabaseProvider, private loader: LoadingController, public batteryService: BatteryProvider, private logService: LogProvider) {
    this.socket.on('sv-successTimeIn', (data) => {
      if (data.success) {
        this.sendLoading.dismiss().then(() => {
          this.alert.present();
        }).catch(() => {
          this.alert.setTitle('Failed.')
            .setSubTitle('Unable to connect to server. Your log will be sent once connected to server.')
            .present();
        });
      }
    });

  }

  send() {
    //show loader
    if (this.connectionService.connection) this.sendLoading.present();
    else this.sendLoading.setContent("Can't connect to server. Saving to local.").present();

    let t = Math.floor(Date.now() / 1000);

    //save log to local database
    this.database.db.executeSql('insert into log(time, month, lat, long, location, battery) VALUES(' + t + ', ' + this.timeService.getCurMonth() + ', ' + this.locationService.lat + ', ' + this.locationService.long + ', "' + this.locationService.location + '",' + this.batteryService.currBattery + ')', {}).then(() => {
      console.log('log added');

      if (this.connectionService.connection) {
        //send log to server
        this.socket.emit('cl-timeIn', {
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
      }else{
        this.sendLoading.dismiss().then(() => {
          this.alert.present();
        })
      }

      //push to log array
      let dt = this.timeService.getDateTime(t * 1000);
      this.logService.local_log.unshift({
        time: dt.time + " " + dt.am_pm,
        date: dt.date,
        map: {
          formattedAddress: this.locationService.location
        },
        isSeen: false
      });
    }).catch(e => {
      console.log(e);
    });
  }

  ionViewDidLoad() {
  }
}