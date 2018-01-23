import { Component } from '@angular/core';
import { NavController, IonicPage } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { TimeProvider } from './../../providers/time/time';
import { LogProvider } from './../../providers/log/log';
import { DatabaseProvider } from './../../providers/database/database';
import { StatusProvider } from '../../providers/status/status';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  long: any;
  lat: any;
  constructor(public navCtrl: NavController, private socket: Socket, public log: LogProvider, public timeService: TimeProvider, public database: DatabaseProvider,public statusService : StatusProvider) {

  }
  
  connect() {
    this.navCtrl.setRoot('MenuPage');
  }

  ionViewDidLoad() {
    // this.database.initializeStorage().then((data) => {
      // if(this.statusService.connection == 'none') this.log.getLocalLogs();
    // });
  }
}