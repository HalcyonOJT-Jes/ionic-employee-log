import { Component } from '@angular/core';
import { NavController, IonicPage } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { LogProvider } from './../../providers/log/log';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, private socket: Socket, public log: LogProvider) {
  }

  connect(){
    this.navCtrl.setRoot('MenuPage');
  }

  ionViewDidLoad(){
    this.log.getLocalLogs();
  }
}