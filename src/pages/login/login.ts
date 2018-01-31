import { Socket } from 'ng-socket-io';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  demos = [
    {id : 1, name : "Demo 1"},
    {id : 2, name : "Demo 2"},
    {id : 3, name : "Demo 3"},
    {id : 4, name : "Demo 4"},
    {id : 5, name : "Demo 5"},
  ];
  constructor(public navCtrl: NavController, private alrtCtrl : AlertController) {

  }

  startDemo(id){
    this.alrtCtrl.create({
      title : 'Welcome!',
      subTitle : 'You have selected demo for Demo ' + id,
      buttons : ['Ok']
    }).present();
  }
}
