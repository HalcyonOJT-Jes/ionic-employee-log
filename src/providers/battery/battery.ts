import { Platform } from 'ionic-angular';
import { BatteryStatus, BatteryStatusResponse } from '@ionic-native/battery-status';
import { Socket } from 'ng-socket-io';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


/*
  Generated class for the BatteryProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class BatteryProvider {
  currBattery : any;
  isPlugged : any;
  

  constructor(public http: HttpClient, private socket : Socket, private batteryStatus : BatteryStatus, private platform : Platform) {
    console.log('Hello BatteryProvider Provider');
    this.platform.ready().then(() => {
      let batteryWatch = this.batteryStatus.onChange().subscribe((status: BatteryStatusResponse) => {
        this.socket.emit('cl-myCurrentStatus', {
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
}
