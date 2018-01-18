import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Observable } from 'rxjs/Observable';
import { Geolocation } from '@ionic-native/geolocation';
import { NativeGeocoder, NativeGeocoderReverseResult } from '@ionic-native/native-geocoder';
import { BatteryStatus, BatteryStatusResponse } from '@ionic-native/battery-status';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker
} from '@ionic-native/google-maps';
import { EmployeesProvider } from '../../providers/employees/employees';

@IonicPage()
@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html',
})
export class MenuPage {
  @ViewChild('map_canvas') mapElement: ElementRef;
  map: GoogleMap;
  
  base64Image: string;
  message: string;
  location: any;
  battery: any;
  long: any;
  lat: any;
  time: any;
  error: any;
  rows: any;

  options: CameraOptions = {
    destinationType: this.camera.DestinationType.DATA_URL,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE,
    cameraDirection: 1
  }

  batteryWatch = this.batteryStatus.onChange().subscribe((status: BatteryStatusResponse) => {
    this.battery = status.level;
  });

  constructor(public platform: Platform, public navCtrl: NavController, public navParams: NavParams, private socket: Socket, private camera: Camera, private geolocation: Geolocation, private batteryStatus: BatteryStatus, private sqlite: SQLite, private nativeGeocoder: NativeGeocoder, private googleMaps: GoogleMaps, public employeeId: EmployeesProvider) {
    this.socket.on('sv-successTimeIn', () => {
      console.log("success");
    });
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
      //initialize google map
      this.loadMap(this.lat, this.long);

      //geocode
      this.nativeGeocoder.reverseGeocode(this.lat, this.long).then((result: NativeGeocoderReverseResult) => {
        this.location = result.thoroughfare + ", " + result.locality + " " + result.administrativeArea + ", " + result.countryCode;
      }).catch((error: any) => {
        console.log(error);
      });;
    }).catch((error) => {
      this.error = error.message;
    });
  }

  openCamera() {
    this.camera.getPicture(this.options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      this.base64Image = 'data:image/jpeg;base64,' + imageData;
      this.socket.emit('cl-send-timein', this.base64Image);
      this.confirmLocation();
    }, (err) => {
      console.log(err);
    });
  }

  confirmLocation(){
    
  }

  send() {
    let t = Math.floor(Date.now() /1000);
    //create or open db and save current log
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {
      // db.executeSql('drop table log', {}).then(() => {
      //   console.log("table deleted");
      // }).catch(e => {
      //   console.log(e);
      // });

      db.executeSql('create table if not exists log(logId INTEGER PRIMARY KEY AUTOINCREMENT, time INTEGER, lat double, long double, location varchar(255), battery INTEGER)', {}).then(() => {
        console.log('Executed SQL')
      }).catch(e => {
        console.log(e);
      });

      //save log to local database
      db.executeSql('insert into log(time, lat, long, location, battery) VALUES(' + t + ', ' + this.lat + ', ' + this.long + ', "' + this.location + '",' + this.battery + ')', {}).then(() => {
        console.log('log added');
        
        //send log to server
        this.socket.emit('cl-timeIn', {
          employeeId: this.employeeId.currentId,
          timeIn: t,
          pic: this.base64Image,
          map: {
            lng: this.long,
            lat: this.lat
          },
          batteryStatus: this.battery,
          msg: this.message,
        });
      }).catch(e => {
        console.log(e);
      });

      db.executeSql('select logId, time, lat, long, location, battery from log order by logId desc', {}).then((data) => {
        this.rows = [];
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            this.rows.push({
              "id" : data.rows.item(i).logId,
              "time": data.rows.item(i).time,
              "lat": data.rows.item(i).lat,
              "long": data.rows.item(i).long,
              "location": data.rows.item(i).location,
              "battery": data.rows.item(i).battery
            });
          }
        }
        console.log(this.rows);
      }).catch(e => {
        console.log(e);
      });
    }).catch(e => {
      console.log(e);
    });
  }

  loadMap(lat, long) {

    let mapOptions: GoogleMapOptions = {
      camera: {
        target: {
          lat: lat,
          lng: long
        },
        zoom: 18,
        tilt: 30
      }
    };

    this.map = GoogleMaps.create('map_canvas', mapOptions);

    // Wait the MAP_READY before using any methods.
    this.map.one(GoogleMapsEvent.MAP_READY)
      .then(() => {
        console.log('Map is ready!');

        // Now you can use all methods safely.
        this.map.addMarker({
          title: 'Ionic',
          icon: 'blue',
          animation: 'DROP',
          position: {
            lat: lat,
            lng: long
          }
        })
          .then(marker => {
            marker.on(GoogleMapsEvent.MARKER_CLICK)
              .subscribe(() => {
                alert('clicked');
              });
          });

      });
  }

  ionViewDidLoad() {
    this.getLocation();
  }

  ionViewWillLeave() {
    this.batteryWatch.unsubscribe();
  }

}