import { Component } from '@angular/core';
import { NavController, NavParams , IonicPage, LoadingController } from 'ionic-angular';
import { TimeProvider } from './../../providers/time/time';
import { LogProvider } from './../../providers/log/log';
import { DatabaseProvider } from './../../providers/database/database';
import { StatusProvider } from '../../providers/status/status';
import { LocationProvider } from './../../providers/location/location';
import { IonicMultiCamera, Picture } from 'ionic-multi-camera';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  long: any;
  lat: any;
  openMapLoading = this.loader.create({
    spinner: 'crescent',
    dismissOnPageChange: true
  });

  constructor(public navCtrl: NavController, private loader : LoadingController, public log: LogProvider, public timeService: TimeProvider, public database: DatabaseProvider,public statusService : StatusProvider, private camera: IonicMultiCamera, private locationService : LocationProvider ) {
  }

  openCamera() {
    this.camera.getPicture().then((pictures : Array<Picture>) => {
      this.database.photos = pictures;
      this.openMapLoading.present().then(() => {
        this.navCtrl.push('MapViewPage');
      })
    }).catch(e => {
      console.log(e);
    });
  }

  ionViewDidLoad() {
    
  }
}