import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { LocationProvider } from './../../providers/location/location';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { NativeGeocoder, NativeGeocoderReverseResult } from '@ionic-native/native-geocoder';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
} from '@ionic-native/google-maps';

@IonicPage()
@Component({
  selector: 'page-map-view',
  templateUrl: 'map-view.html',
})
export class MapViewPage {

  @ViewChild('map_canvas') mapElement: ElementRef;
  map: GoogleMap;

  constructor(public alrtCtrl : AlertController, public navCtrl: NavController, public navParams: NavParams, private nativeGeocoder: NativeGeocoder, public locationService: LocationProvider, public barcodeScanner : BarcodeScanner) {
  }

  confirmLocation() {
    //initialize google map
    this.loadMap(this.locationService.lat, this.locationService.long).then(() => {
      //geocode
      this.nativeGeocoder.reverseGeocode(this.locationService.lat, this.locationService.long).then((result: NativeGeocoderReverseResult) => {
        this.locationService.location = result.thoroughfare + ", " + result.locality + " " + result.administrativeArea + ", " + result.countryCode;
      }).catch((error: any) => {
        console.log(error);
      });
    }).catch(e => {
      console.log(e);
    });
  }

  loadMap(lat, long) {
    return new Promise((resolve, reject) => {
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
                resolve();
            });
        }).catch(e => {
          console.log(e);
          reject();
        });
    });
  }

  accept() {
    this.barcodeScanner.scan().then((data) => {
      this.navCtrl.setRoot('MenuPage', {
        scanResult : data.text
      });
    }).catch(e => {
      this.alrtCtrl.create({
        title : 'Scan failed',
        subTitle : e,
        buttons : ['Ok']
      }).present();
    });
  }

  cancel() {
    this.navCtrl.setRoot('HomePage');
  }

  ionViewDidLoad() {
    this.confirmLocation();
  }

}
