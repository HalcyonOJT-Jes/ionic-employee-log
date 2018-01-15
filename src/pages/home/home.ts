import { Component } from '@angular/core';
import { NavController, IonicPage } from 'ionic-angular';
import { Socket } from 'ng-socket-io';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  nickname = 'Juan Dela Cruz';
  _time : string;

  constructor(public navCtrl: NavController, private socket: Socket) {
    
  }

  connect(){
    this.socket.connect();
    this.navCtrl.setRoot("MenuPage");
  }  
}