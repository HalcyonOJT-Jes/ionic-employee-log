import { AuthProvider } from './../auth/auth';
import { SocketProvider } from './../socket/socket';
import { Platform } from 'ionic-angular';
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
  
  constructor(public http: HttpClient,  public batteryService: BatteryProvider, public connectionService: ConnectionProvider, public deviceService: DeviceProvider, public locationService: LocationProvider, public platform: Platform, private socketService : SocketProvider, public auth : AuthProvider) {
    console.log('Hello StatusProvider Provider');
    this.auth.isAuth.subscribe(x => {
      if(x){
        this.socketService.socket.on('sv-myCurrentStatus', () => {
          console.log("sv-myCurrentStatus");
          this.platform.ready().then(() => {
            this.socketService.socket.emit('cl-myCurrentStatus', {
              battery:{
                level : this.batteryService.currBattery,
                plugged : this.batteryService.isPlugged
              },
              location : {
                formattedAddress: this.locationService.location,
                lat: this.locationService.lat,
                lng: this.locationService.long,
              },
              connection: this.connectionService.network.type,
              phone : {
                model: this.deviceService.model,
                platform: this.deviceService.platform,
                manufacturer: this.deviceService.manufacturer,
                serial: this.deviceService.serial,
                uuid: this.deviceService.uuid
              }
            });
          });
        });
      }
    })
  }
}
