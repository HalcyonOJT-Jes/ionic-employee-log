import { LocationProvider } from './../../providers/location/location';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { NativeGeocoder, NativeGeocoderReverseResult } from '@ionic-native/native-geocoder';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker
} from '@ionic-native/google-maps';

/**
 * Generated class for the MapViewPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-map-view',
  templateUrl: 'map-view.html',
})
export class MapViewPage {
  
  @ViewChild('map_canvas') mapElement: ElementRef;
  map: GoogleMap;
  b64 : any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private nativeGeocoder: NativeGeocoder, private googleMaps: GoogleMaps, public locationService : LocationProvider) {
    this.b64 = this.navParams.get('b64');
  }

  confirmLocation() {
    //initialize google map
    this.loadMap(this.locationService.lat, this.locationService.long);

    //geocode
    this.nativeGeocoder.reverseGeocode(this.locationService.lat, this.locationService.long).then((result: NativeGeocoderReverseResult) => {
      this.locationService.location = result.thoroughfare + ", " + result.locality + " " + result.administrativeArea + ", " + result.countryCode;
    }).catch((error: any) => {
      console.log(error);
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

  accept(){
    this.navCtrl.pop({
      direction : 'back'
    });
  }

  cancel(){
    this.navCtrl.push('HomePage');
  }

  ionViewDidLoad() {
    this.confirmLocation();
  }

}
