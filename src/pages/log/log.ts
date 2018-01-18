import { Socket } from 'ng-socket-io';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Observable } from 'rxjs/Observable';
import { EmployeesProvider } from './../../providers/employees/employees';
import { LogProvider } from '../../providers/log/log';
/**
 * Generated class for the LogPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-log',
  templateUrl: 'log.html',
})
export class LogPage {
  local_logs = [];
  t = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, public socket: Socket, public employeeId: EmployeesProvider, private sqlite: SQLite, private logs : LogProvider) {
    // this.getRemoteLogs().subscribe( data => {
    //   this.logs = data;
    //   this.logs.forEach(log => {
    //     this.t.push(log.timein);
    //   });
    // });
  }

  getRemoteLogs(){
    let obs = new Observable((observer) => {
      this.socket.on('sv-sendinitemployeelog', data => {
        let temp = [];
        for (let log of data.logs) {
          log.timeintext = (new Date(log.timein)).toUTCString();
          temp.push(log);
        }
        observer.next(temp);
      });
    });
    return obs;
  }

  sendPendingLogs() {

  }

  requestLogs() {
    this.socket.emit('cl-getinitlog', { employeeid: this.employeeId.currentId });
  }



  ionViewDidLoad() {
    // this.requestLogs();
    this.local_logs = this.logs.local_log;
  }
}
