import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the ScanPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html',
})
export class ScanPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner : BarcodeScanner, private alrtController : AlertController) {
  }

  ionViewDidLoad() {
    this.barcodeScanner.scan().then((data) => {
      this.alrtController.create({
        title : 'Scan success',
        subTitle : 'Scan result : ' + data.text + '\n Format : ' + data.format,
        buttons : ['Ok']
      }).present();
    }).catch(e => {
      this.alrtController.create({
        title : 'Scan failed',
        subTitle : e,
        buttons : ['Ok']
      }).present();
    });
  }

}
