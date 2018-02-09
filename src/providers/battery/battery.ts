import { AuthProvider } from './../auth/auth';
import { Platform } from 'ionic-angular';
import { BatteryStatus, BatteryStatusResponse } from '@ionic-native/battery-status';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SocketProvider } from '../socket/socket';


/*
  Generated class for the BatteryProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class BatteryProvider {
  currBattery : any;
  isPlugged : any;
  

  constructor(public http: HttpClient, private batteryStatus : BatteryStatus, private platform : Platform, private auth : AuthProvider, public socketService : SocketProvider) {
    this.auth.isAuth.subscribe(x => {
      if(x){
        console.log('Hello BatteryProvider Provider');
        this.platform.ready().then(() => {
          this.batteryStatus.onChange().subscribe((status: BatteryStatusResponse) => {
            this.socketService.socket.emit('cl-myCurrentStatus', {
              battery:{
                level : status.level,
                plugged : status.isPlugged
              }
            });
        
            this.currBattery = status.level;
            this.isPlugged = status.isPlugged;
          });
        });
      }
    });
  }
}
