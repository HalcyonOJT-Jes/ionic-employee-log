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
  batteryWatch = this.batteryStatus.onChange().subscribe((status: BatteryStatusResponse) => {
    this.currBattery = status.level;
    this.isPlugged = status.isPlugged;
  });

  constructor(public http: HttpClient, private socket : Socket, private batteryStatus : BatteryStatus) {
    console.log('Hello BatteryProvider Provider');
  }

}
