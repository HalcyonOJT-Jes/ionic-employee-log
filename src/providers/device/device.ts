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
      this.model = device.model;
      this.platform = device.platform;
      this.manufacturer = device.manufacturer;
      this.serial = device.serial;
      this.uuid = device.uuid;

      this.socket.emit('cl-deviceInfo', {
        model : device.model,
        platform : device.platform,
        manufacturer : device.manufacturer,
        serial : device.serial,
        uuid : device.uuid
      });
    });
  }
}