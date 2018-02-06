import { Socket } from 'ng-socket-io';
import { Platform } from 'ionic-angular';
import { Device } from '@ionic-native/device';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class DeviceProvider {
  model : any;
  platform : any;
  manufacturer : any;
  serial : any;
  uuid : any;

  constructor(public http: HttpClient, private device : Device, public _platform : Platform, private socket : Socket) {
    console.log("Hello Device Provider");
    _platform.ready().then(() => {
      console.log("Device Ready");
      this.model = this.device.model;
      this.platform = this.device.platform;
      this.manufacturer = this.device.manufacturer;
      this.serial = this.device.serial;
      this.uuid = this.device.uuid;

      this.socket.emit('cl-deviceInfo', {
        model : this.device.model,
        platform : this.device.platform,
        manufacturer : this.device.manufacturer,
        serial : this.device.serial,
        uuid : this.device.uuid
      });
    });
  }
}