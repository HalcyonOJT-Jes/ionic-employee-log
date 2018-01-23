import { Platform } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DeviceProvider } from './../device/device';
import { BatteryProvider } from '../battery/battery';
import { ConnectionProvider } from '../connection/connection';
import { LocationProvider } from '../location/location';
/*
  Generated class for the StatusProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class StatusProvider {
  connection : any;
  
  constructor(public http: HttpClient, private socket: Socket, public batteryService: BatteryProvider, public connectionService: ConnectionProvider, public deviceService: DeviceProvider, public locationService: LocationProvider, public platform: Platform) {
    console.log('Hello StatusProvider Provider');

    this.socket.on('sv-myCurrentStatus', () => {
      this.platform.ready().then(() => {
        this.socket.emit('cl-myCurrentStatus', {
          battery: this.batteryService.currBattery,
          batteryPlugged: this.batteryService.isPlugged,
          location: this.locationService.location,
          lat: this.locationService.lat,
          long: this.locationService.long,
          connection: this.connectionService.network.type,
          model: this.deviceService.model,
          platform: this.deviceService.platform,
          manufacturer: this.deviceService.manufacturer,
          serial: this.deviceService.serial,
          uuid: this.deviceService.uuid
        });
      });
    });
  }
}
