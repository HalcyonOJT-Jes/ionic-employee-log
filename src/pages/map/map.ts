import { Component, ViewChild, ElementRef } from '@angular/core';
import { Platform } from 'ionic-angular/platform/platform';
import { LocationProvider } from './../../providers/location/location';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
} from '@ionic-native/google-maps';

@IonicPage()
@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {

  @ViewChild('canvas') mapElement: ElementRef;
  map: GoogleMap;
  constructor(public navCtrl: NavController, public navParams: NavParams, private locationServices: LocationProvider, private platform: Platform, private googleMaps: GoogleMaps) {
    this.platform.ready().then(() => {
      this.loadMap(this.locationServices.lat, this.locationServices.long).then(() => {
        console.log("success");
      }).catch(e => {
        console.log(e);
      });;
    });
  }

  loadMap(lat, long) {
    return new Promise((res, rej) => {
      console.log("loadmap:" + lat + ", " + long);
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

      this.map = GoogleMaps.create('canvas', mapOptions);

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
              res(true);
            });
        }).catch(e => {
          console.log(e);
          res(false);
        });
    });
  }

  ionViewDidLoad() {
    console.log("ion view did load");
    
  }

}
