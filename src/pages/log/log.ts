import { Socket } from 'ng-socket-io';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
/**
 * Generated class for the LogPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-log',
  templateUrl: 'log.html',
})
export class LogPage {

  logs : Array<{
    time : string,
    map : {
      lat : any,
      long : any
    }
    // img : string,
  }>

  constructor(public navCtrl: NavController, public navParams: NavParams, public socket: Socket) {
    
  }

  getLogs(){
    // this.socket.emit('cl-getinitlog', );
  }

  ionViewDidLoad() {
    this.getLogs();
  }
  

}
