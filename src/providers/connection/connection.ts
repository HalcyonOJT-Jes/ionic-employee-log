import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import { ToastController, Platform } from 'ionic-angular';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { Observable } from 'rxjs/Observable';
import { LogProvider } from './../log/log';
import { MessageProvider } from './../message/message';
import { EmployeesProvider } from './../employees/employees';
import { AuthProvider } from './../auth/auth';
import { SocketProvider } from '../socket/socket';

@Injectable()
export class ConnectionProvider {
  networkType: string;
  connection: boolean;
  constructor(private alertCtrl: AlertController, public http: HttpClient, public network: Network, public employees: EmployeesProvider, public toast: ToastController, public platform: Platform, private logService: LogProvider, private auth: AuthProvider, private messageService: MessageProvider, private socketService: SocketProvider) {
    console.log('Hello ConnectionProvider Provider');
    console.log("----------initial connection-------");
    this.connection = this.network.type === 'none' ? false : true;
    this.network.onchange().subscribe(() => {
      this.networkType = this.network.type;
      if (this.networkType != 'none') this.showConnectionUpdate('state-connected');
      else {
        this.showConnectionUpdate('state-disconnected');
        this.connection = false;
      }
    });

    this.auth.isAuth.subscribe(x => {
      if (x) {
        //enable ons if an user has logged in
        this.socketService.socket.on('connect_error', () => {
          if (this.connection == true) {
            this.connection = false;
            console.log("connect_error : connection -> " + this.connection);

            //get local logs and messages
            this.messageService.getLocalMessages();
            this.logService.getLocalLogs();

            this.alertCtrl.create({
              title: 'Server error',
              subTitle: 'The server is currently unavailable. Your logs and messages will be sent once connected to server.',
              buttons: ['Ok']
            }).present();
          }
        });

        //watch for reconnection attempts
        this.socketService.socket.on('reconnect_attempt', () => {
          this.connection = false;
          console.log("trying to reconnect : connection -> " + this.connection);
        });

        this.socketService.socket.on('connect', () => {
          //reinitialize
          //get remote logs and messages
          this.logService.requestRemoteLogs();
          this.messageService.requestInitMessages();

          this.connection = true;
          this.toast.create({
            message: "Connected to Server.",
            cssClass: 'state-serverConnected',
            duration: 3000
          }).present();
        });

        //watch for reconnection
        this.socketService.socket.on('reconnect', () => {
          console.log("reconnected : connection should be false : connection -> " + this.connection);
          this.connection = true;
          console.log("connection set to true");
        });
      }
    });
  }

  showConnectionUpdate(_class) {
    let msg = this.networkType == 'none' ? "You have been disconnected" : "You are now connected";
    this.toast.create({
      message: msg,
      duration: 3000,
      cssClass: _class
    }).present();
  }

  // serverConnect() {
  //   let obs = new Observable((observer) => {
  //     console.log("Connected to server");
  //     observer.next();
  //   });
  // });
  //   return obs;
  // }
}