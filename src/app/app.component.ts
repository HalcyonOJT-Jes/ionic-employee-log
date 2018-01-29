import { EmployeesProvider } from './../providers/employees/employees';
import { Socket } from 'ng-socket-io';
import { ConnectionProvider } from './../providers/connection/connection';
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage:string = 'HomePage';
  pages: Array<{title: string, component: any}>;
  employeeIds = [];
  
  constructor(private employees : EmployeesProvider, private socket : Socket, platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, connection : ConnectionProvider ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.initializeApp();
      statusBar.styleDefault();
      splashScreen.hide();
    });

    this.pages = [
      { title : 'Home', component: 'HomePage'},
      { title : 'Log', component: 'LogPage'},
      { title : 'Chat', component: 'ChatPage'},
      { title : 'Scan', component : 'ScanPage'}
    ];
    
    this.employeeIds = [4324, 4325];
  }

  openPage(page){
    this.nav.setRoot(page.component);
  }

  initializeApp(){
    console.log("initializeApp()");
    this.socket.connect();
  }
}