import { MessageProvider } from './../providers/message/message';
import { ConnectionProvider } from './../providers/connection/connection';
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { OneSignal } from '@ionic-native/onesignal';
import { Storage } from '@ionic/storage';
import { AuthProvider } from '../providers/auth/auth';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage:string;
  pages: Array<{title: string, component: any}>;
  employeeIds = [];
  
  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, connection : ConnectionProvider, private oneSignal : OneSignal, private messages : MessageProvider, private storage : Storage, private auth : AuthProvider) {
    platform.ready().then(() => {
      this.initializeApp();
      // this.initializeOneSignal();
      //checks for connection; pass connection status to token existence check;
      let b : boolean = connection.network.type != 'none' ? true : false;
      console.log(b);
      this.auth.checkExistingToken(b).then((valid) => {
        if(valid) {
          this.auth.isAuth.next(true);
          this.rootPage = 'HomePage';
        }else this.rootPage = 'LoginPage';
      }).catch(e => {
        console.log(e);
      });
    });

    this.pages = [
      { title : 'Home', component: 'HomePage'},
      { title : 'Log', component: 'LogPage'},
      { title : 'Chat', component: 'ChatPage'},
      { title : 'Location Simulation', component : 'MapPage'},
      { title : 'Logout', component : ''}
    ];

    this.messages.localNotif.on('click', () => {
      this.nav.setRoot('ChatPage');
    });
  }

  openPage(page){
    if(page.title !== 'Logout') this.nav.setRoot(page.component);
    else {
      this.storage.remove('token').then(() => {
        this.auth.isAuth.next(false);
        this.nav.setRoot('LoginPage');
      }).catch(e => {
        console.log(e);
      });
    }
  }

  initializeApp(){
    console.log("initializeApp()");
  }

  // initializeOneSignal(){
  //   this.oneSignal.startInit('021ea496-ff09-4568-8a6f-04a56105b61d','282096607572');
  //   this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.InAppAlert);
  //   this.oneSignal.handleNotificationReceived().subscribe(() => {
  //     console.log("notification received");
  //   });
  //    this.oneSignal.handleNotificationOpened().subscribe(() => {
  //     console.log("notification opened");
  //   });
  //   this.oneSignal.endInit();
  // }
}