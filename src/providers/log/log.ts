import { ConnectionProvider } from './../connection/connection';
import { EmployeesProvider } from './../employees/employees';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TimeProvider } from './../time/time';
import { DatabaseProvider } from '../database/database';
/*
  Generated class for the LogProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LogProvider {
  local_log = [];
  custom_log = [];

  constructor(private employees : EmployeesProvider, private connectionService : ConnectionProvider, public http: HttpClient, public timeService: TimeProvider, public database: DatabaseProvider, private socket: Socket, private employeeService : EmployeesProvider) {
    console.log("Hello Log Provider");
    this.socket.on('sv-notifSeen', (data) => {
      this.requestRemoteLogs();
    });
    this.socket.emit('cl-getInitNotifEmployee', { employeeId : this.employees.currentId});
    this.socket.on('sv-sendInitNotif', data => {
      this.getRemoteLogs(data)
    });
  }

  getCustomLogs(month) {
    // get existing logs
    this.database.db.executeSql('select * from log where month = ' + month + ' order by logId DESC', {}).then((data) => {
      this.custom_log = [];
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          let dt = this.timeService.getDateTime(data.rows.item(i).time * 1000);

          this.custom_log.push({
            id    : data.rows.item(i).logId,
            time  : dt.time + " " + dt.am_pm,
            date  : dt.date,
            map   : {
              formattedAddress : data.rows.item(i).location
            },
            isSeen : data.rows.item(i).isSeen
          });
        }
      }
    }).catch(e => {
      console.log(e);
    });
  }

  getLocalLogs() {
    console.log("getting local logs");
    // get existing logs
    this.database.db.executeSql('select * from log order by logId DESC', {}).then((data) => {
      this.local_log = [];
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          let dt = this.timeService.getDateTime(data.rows.item(i).time * 1000);

          this.local_log.push({
            id    : data.rows.item(i).logId,
            time  : dt.time + " " + dt.am_pm,
            date  : dt.date,
            map   : {
              formattedAddress : data.rows.item(i).location
            },
            isSeen : data.rows.item(i).isSeen
          });
        }
      }
      // console.log(this.local_log);
    }).catch(e => {
      console.log(e);
    });
  }

  getRemoteLogs(data){
    for (let log of data) {
      let dt = this.timeService.getDateTime(log.timeIn * 1000)
      log.time = dt.time + " " + dt.am_pm;
      log.date = dt.date;
      this.local_log.push(log);
    }
  }

  requestRemoteLogs(){
    this.socket.emit('cl-getInitNotifEmployee', {employeeId : this.employeeService.currentId });
  }
}
