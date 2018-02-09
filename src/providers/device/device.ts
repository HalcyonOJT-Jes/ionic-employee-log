import { Platform } from 'ionic-angular';
import { Device } from '@ionic-native/device';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthProvider } from '../auth/auth';
import { SocketProvider } from '../socket/socket';

@Injectable()
export class DeviceProvider {
  model : any;
  platform : any;
  manufacturer : any;
  serial : any;
  uuid : any;

  constructor(public http: HttpClient, private device : Device, public _platform : Platform,  private auth : AuthProvider, private socketService : SocketProvider) {
    this.auth.isAuth.subscribe(x => {
      if(x){
        console.log("Hello Device Provider");
        _platform.ready().then(() => {
          this.model = this.device.model;
          this.platform = this.device.platform;
          this.manufacturer = this.device.manufacturer;
          this.serial = this.device.serial;
          this.uuid = this.device.uuid;
    
          this.socketService.socket.emit('cl-deviceInfo', {
            model : this.device.model,
            platform : this.device.platform,
            manufacturer : this.device.manufacturer,
            serial : this.device.serial,
            uuid : this.device.uuid
          });
        });
      }
    });
  }
}