import { Component } from '@angular/core';
import { NavController, NavParams , IonicPage, LoadingController } from 'ionic-angular';
import { TimeProvider } from './../../providers/time/time';
import { LogProvider } from './../../providers/log/log';
import { DatabaseProvider } from './../../providers/database/database';
import { StatusProvider } from '../../providers/status/status';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { LocationProvider } from './../../providers/location/location';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  long: any;
  lat: any;
  options: CameraOptions = {
    destinationType: this.camera.DestinationType.DATA_URL,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE,
    cameraDirection: 1,
    correctOrientation : true
  }

  openMapLoading = this.loader.create({
    spinner: 'crescent',
    dismissOnPageChange: true
  });

  constructor(public navCtrl: NavController, private loader : LoadingController, public log: LogProvider, public timeService: TimeProvider, public database: DatabaseProvider,public statusService : StatusProvider, private camera: Camera, private locationService : LocationProvider ) {
  }

  openCamera() {
    this.camera.getPicture(this.options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      this.database.base64Image = 'data:image/jpeg;base64,' + imageData;
      //show loading
      this.openMapLoading.present().then(() => {
        //confirm locaiton
        this.navCtrl.push('MapViewPage', {
          lat: this.locationService.lat,
          long: this.locationService.long
        })
      });
    }, (err) => {
      console.log(err);
    });
  }

  ionViewDidLoad() {
    
  }
}