import { MessageProvider } from './../providers/message/message';
import { ConnectionProvider } from './../providers/connection/connection';
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { OneSignal } from '@ionic-native/onesignal';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage:string = 'HomePage';
  pages: Array<{title: string, component: any}>;
  employeeIds = [];
  
  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, connection : ConnectionProvider, private oneSignal : OneSignal, private messages : MessageProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.initializeApp();
      this.initializeOneSignal();
      statusBar.styleDefault();
      statusBar.hide();
      splashScreen.hide();
    });

    this.pages = [
      { title : 'Home', component: 'HomePage'},
      { title : 'Log', component: 'LogPage'},
      { title : 'Chat', component: 'ChatPage'},
      { title : 'Barcode Scanner', component : 'ScanPage'},
      { title : 'Location Simulation', component : 'MapPage'}
    ];

    this.messages.localNotif.on('click', () => {
      this.nav.setRoot('ChatPage');
    });
  }

  openPage(page){
    this.nav.setRoot(page.component);
  }

  initializeApp(){
    console.log("initializeApp()");
  }

  initializeOneSignal(){
    this.oneSignal.startInit('021ea496-ff09-4568-8a6f-04a56105b61d','282096607572');
    this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.InAppAlert);
    this.oneSignal.handleNotificationReceived().subscribe(() => {
      console.log("notification received");
    });
     this.oneSignal.handleNotificationOpened().subscribe(() => {
      console.log("notification opened");
    });
    this.oneSignal.endInit();
  }
}