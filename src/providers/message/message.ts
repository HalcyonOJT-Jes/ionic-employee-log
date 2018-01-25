import { DatabaseProvider } from './../database/database';
import { TimeProvider } from './../time/time';
import { Observable } from 'rxjs/Observable';
import { Socket } from 'ng-socket-io';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EmployeesProvider } from '../employees/employees';
/*
  Generated class for the MessageProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class MessageProvider {
  messages = [];
  constructor(private employees : EmployeesProvider, public http: HttpClient, private socket: Socket, private timeService: TimeProvider, private database : DatabaseProvider) {
    console.log('Hello MessageProvider Provider');
    this.loadInitialMessages(employees.currentId).then((data) => {
      console.log("successfully requested initial messages");
    }).catch(e => {
      console.log(e);
      this.loadLocalMessages();
    });

    this.socket.on('sv-sendInitMessages', (data) => {
      for(let i of data){
        let dt = this.timeService.getDateTime(i.sentAt * 1000);
        i.time = dt.time + " " + dt.am_pm;
        this.messages.push(i);
      }
    });
  }

  loadLocalMessages() {
    this.database.db.executeSql('select * from message order by messageId desc', {}).then((data) => {
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          let dt = this.timeService.getDateTime(data.rows.item(i).time * 1000);

          this.messages.push({
            "id": data.rows.item(i).messageId,
            "time": dt.time + " " + dt.am_pm,
            "date": dt.date,
            "content" : data.rows.item(i).content,
            "isMe" : data.rows.item(i).isMe
          });
        }
      }
    }).catch(e => {
      console.log(e);
    });
  }

  loadInitialMessages(employeeId) {
    return new Promise((res, rej) => {
      if (this.socket.emit('cl-getInitMessages', { employeeId : employeeId })) {
        res({ success: true });
      } else {
        rej("failed to connect to server");
      }
    });
  }

  getMessage() {
    let observable = new Observable(observer => {
      this.socket.on('sv-newMessageFromAdmin', (data) => {
        let dt = this.timeService.getDateTime(data.sentAt * 1000);
        data.time = dt.time + " " + dt.am_pm;
        observer.next(data);
      });
    });
    return observable;
  }
}
