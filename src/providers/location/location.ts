import { Socket } from 'ng-socket-io';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NativeGeocoder, NativeGeocoderReverseResult } from '@ionic-native/native-geocoder';
import { Geolocation } from '@ionic-native/geolocation';
import { Platform } from 'ionic-angular';

/*
  Generated class for the LocationProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocationProvider {
  long: any;
  lat: any;
  location: string;
  watch = this.geolocation.watchPosition().subscribe((data) => {
    this.long = data.coords.longitude;
    this.lat = data.coords.latitude;
    this.geocoder.reverseGeocode(this.lat, this.long).then((result: NativeGeocoderReverseResult) => {
      let newLocation = result.thoroughfare + ", " + result.locality + " " + result.administrativeArea + ", " + result.countryCode;
      if (this.location != newLocation) {
        this.location = newLocation;
        this.socket.emit('cl-myCurrentStatus', {
          location: {
            formattedAddress: newLocation,
            lat: this.lat,
            long: this.long
          }
        });
      }
    }).catch((error: any) => {
      console.log(error);
    });
  });

  constructor(public platform: Platform, public http: HttpClient, private geolocation: Geolocation, private socket: Socket, private geocoder: NativeGeocoder) {
    console.log('Hello LocationProvider Provider');
    this.getLocation();
  }

  async getLocation() {
    await this.platform.ready();
    // get longitude and latitude
    await this.geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }).then((resp) => {
      this.long = resp.coords.longitude;
      this.lat = resp.coords.latitude;
      console.log("Location Ready");
    }).catch((error) => {
      console.log(error);
    });
  }
}
