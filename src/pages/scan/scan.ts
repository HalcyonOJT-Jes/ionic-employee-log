import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

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
      this.navCtrl.setRoot('MenuPage', {
        scanResult : data.text
      });
    }).catch(e => {
      this.alrtController.create({
        title : 'Scan failed',
        subTitle : e,
        buttons : ['Ok']
      }).present();
    });
  }

}
