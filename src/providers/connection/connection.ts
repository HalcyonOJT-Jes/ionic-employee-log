import { EmployeesProvider } from './../employees/employees';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import { ToastController, Platform } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { Observable } from 'rxjs/Observable';
import { MessageProvider } from '../message/message';
import { LogProvider } from '../log/log';

@Injectable()
export class ConnectionProvider {
  networkType: string;
  connection: boolean = true;
  constructor(private alertCtrl: AlertController, public http: HttpClient, public network: Network, public socket: Socket, public employees: EmployeesProvider, public toast: ToastController, public platform: Platform, private messageService: MessageProvider, private logService: LogProvider) {
    console.log('Hello ConnectionProvider Provider');
    console.log("----------initial connection-------");
    this.network.onConnect().subscribe(() => {
      this.socket.connect();
      console.log("onConnect triggered");
      this.showConnectionUpdate('connected', 'state-connected');
    });

    this.network.onDisconnect().subscribe(() => {
      this.connection = false;
      this.showConnectionUpdate('disconnected', 'state-disconnected');
    });

    this.socket.on('connect_error', () => {
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

    this.serverConnect().subscribe(() => {
      //reinitialize
      //get remote logs and messages
      this.logService.requestRemoteLogs();
      this.messageService.requestInitMessages();

      this.connection = true;
      this.socket.emit('cl-sendEmployeeId', { employeeId: this.employees.currentId });
      this.toast.create({
        message: "Connected to Server.",
        cssClass: 'state-serverConnected',
        duration: 3000
      }).present();
    });

    //watch for reconnection attempts
    this.socket.on('reconnect_attempt', () => {
      this.connection = false;
      console.log("trying to reconnect : connection -> " + this.connection);
    });

    //watch for reconnection
    this.reconnect().subscribe(() => {
      console.log("reconnected : connection should be false : connection -> " + this.connection);
      this.connection = true;
      console.log("connection set to true");
    });
  }

  showConnectionUpdate(state, _class) {
    this.toast.create({
      message: `You are now ${state} via ${this.network.type}`,
      duration: 3000,
      cssClass: _class
    }).present();
  }

  reconnect() {
    let obs = new Observable((observer) => {
      this.socket.on('reconnect', () => {
        observer.next();
      });
    });
    return obs;
  }

  serverConnect() {
    let obs = new Observable((observer) => {
      this.socket.on('sv-requestEmployeeId', () => {
        console.log("Connected to server");
        observer.next();
      });
    });
    return obs;
  }
}