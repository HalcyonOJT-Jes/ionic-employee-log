import { EmployeesProvider } from './../employees/employees';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import { ToastController, Platform } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { Observable } from 'rxjs/Observable';

/*
  Generated class for the ConnectionProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ConnectionProvider {
  networkType: string;
  connection : boolean;
  reconnect_attemps : number = 0;
  constructor(private alertCtrl: AlertController, public http: HttpClient, public network: Network, public socket: Socket, public employees: EmployeesProvider, public toast: ToastController, public platform: Platform) {
    console.log('Hello ConnectionProvider Provider');
    console.log("----------initial connection-------");
    this.connection = true;
    this.network.onConnect().subscribe(() => {
    this.connection = true;
    console.log("onConnect triggered");
      this.showConnectionUpdate('connected', 'state-connected');
    });

    this.network.onDisconnect().subscribe(() => {
      this.showConnectionUpdate('disconnected', 'state-disconnected');
    });

    this.socket.on('connect_error', () => {
      if (this.connection == true) {
        this.reconnect_attemps = 0;
        this.connection = false;
        this.alertCtrl.create({
          title: 'Server error',
          subTitle: 'The server is currently unavailable. Your logs and messages will be sent once connected to server.',
          buttons: ['Ok']
        }).present();
      }
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnect_attemps++;
      console.log("trying to reconnect");
    });

    this.reconnect().subscribe(() => {
      if (this.connection == false) {
        console.log("reconnected; connection is true;");
        this.connection = true;
        this.toast.create({
          message: "Connected to Server.",
          showCloseButton: true,
          closeButtonText: 'Ok',
          cssClass: 'state-serverConnected'
        }).present();
      }
    });

    this.socket.on('sv-requestEmployeeId', () => {
      console.log("sv-requestemployeeid");
      this.socket.emit('cl-sendEmployeeId', { employeeId: this.employees.currentId });
    });
  }

  showConnectionUpdate(state, _class) {
    this.toast.create({
      message: `You are now ${state} via ${this.network.type}`,
      duration: 3000,
      cssClass: _class
    }).present();
  }

  reconnect(){
    let obs = new Observable((observer) => {
      this.socket.on('reconnect', () => {

      });
      observer.next();
    });
    return obs;
  }
}