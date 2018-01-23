import { EmployeesProvider } from './../employees/employees';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import { ToastController, Platform } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
/*
  Generated class for the ConnectionProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ConnectionProvider {
  networkType: string;

  constructor(public http: HttpClient, public network: Network, private socket: Socket, public employees: EmployeesProvider, public toast: ToastController, public platform : Platform) {
    console.log('Hello ConnectionProvider Provider');
    this.socket.connect();
    this.initializeConnection();
    this.socket.emit('cl-getInitNotifEmployee', {employeeId : this.employees.currentId });
    
    this.network.onConnect().subscribe(() => {
      this.initializeConnection();
      this.showConnectionUpdate('connected', 'state-connected');
    });

    //send employee id and request remote logs
    this.network.onDisconnect().subscribe(() => {
      this.showConnectionUpdate('disconnected', 'state-disconnected');
    });

    this.socket.on('pong', (latency) => {
      console.log("pong sent : " + latency);
    })

    this.socket.on('ping', () => {
      console.log("ping sent");
    })
  }

  initializeConnection(){
    this.socket.emit('cl-sendEmployeeId', { employeeId: this.employees.currentId });
    let connectionSubscription = this.network.onConnect().subscribe(() => {
      this.networkType = this.network.type;
    });
  }

  showConnectionUpdate(state, _class) {
    this.toast.create({
      message: `You are now ${state}ed via ${this.networkType}`,
      duration: 3000,
      cssClass: _class
    }).present();
  }
}