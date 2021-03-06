import { SocketProvider } from './../../providers/socket/socket';
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
import { NativeGeocoder, NativeGeocoderReverseResult } from '@ionic-native/native-geocoder';
import { LoadingController } from 'ionic-angular/components/loading/loading-controller';

@IonicPage()
@Component({
  selector: 'page-map',
  templateUrl: 'map.html',
})
export class MapPage {
  mapTapLoader = this.loader.create({
    content : 'Sending location. Please Wait.'
  });

  @ViewChild('canvas') mapElement: ElementRef;
  map: GoogleMap;
  constructor(public navCtrl: NavController, public navParams: NavParams, private locationService: LocationProvider, private platform: Platform,  private nativeGeocoder: NativeGeocoder, private loader : LoadingController, public socketService : SocketProvider ) {
    this.platform.ready().then(() => {

      this.loadMap(this.locationService.lat, this.locationService.long).then(() => {
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
          
          this.map.on(GoogleMapsEvent.MAP_CLICK).subscribe((latLng) => {
            this.mapTapLoader.present();
            console.log("clicked");
            console.log(latLng);
            this.map.addMarker({
              icon: 'red',
              animation: 'DROP',
              position: {
                lat : latLng[0].lat,
                lng : latLng[0].lng
              }
            }).then(() => {
              this.mapTapLoader.dismiss();
              this.nativeGeocoder.reverseGeocode(latLng[0].lat, latLng[0].lng).then((result: NativeGeocoderReverseResult) => {
                let formattedAddress : string = '';
                for(let v in result){
                  if(result.hasOwnProperty(v)){
                    if(result[v] != undefined) formattedAddress += result[v] + " ";
                  }
                }
                console.log(formattedAddress);

                this.socketService.socket.emit('cl-myCurrentStatus', {
                  location : {
                    lat : latLng[0].lat,
                    lng : latLng[0].lng,
                    formattedAddress : formattedAddress
                  }
                });
              }).catch((error: any) => {
                console.log(error);
              });
              
            }).catch(e => {
              console.log(e);
            });
          });

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
        }).catch(e => {
          console.log(e);
        });
    });
  }

  ionViewDidLoad() {
    console.log("ion view did load");

  }

}
