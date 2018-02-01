import { DatabaseProvider } from './../database/database';
import { TimeProvider } from './../time/time';
import { Observable } from 'rxjs/Observable';
import { Socket } from 'ng-socket-io';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EmployeesProvider } from '../employees/employees';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { ConnectionProvider } from '../connection/connection';
/*
  Generated class for the MessageProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class MessageProvider {
  messages = [];
  maxLocalUnix: number = 0;
  constructor(private employees: EmployeesProvider, public http: HttpClient, private socket: Socket, private timeService: TimeProvider, private database: DatabaseProvider, public localNotif: LocalNotifications, private connectionService: ConnectionProvider) {

    this.getMessage().subscribe(data => {
      this.messages.push(data);
    });

    this.database._dbready.subscribe((ready) => {
      if (ready) {
        this.getInitMessages();
      }
    });

    this.connectionService.network.onchange().subscribe(() => {
      if(this.connectionService.network.type != 'none'){
        console.log("yay");
        console.log(this.connectionService.network.type);
        this.messages = [];
        this.getInitMessages();
      }
    });

    console.log('Hello MessageProvider Provider');
    

    this.socket.on('sv-sendInitMessages', (data) => {
      let maxRemoteUnix: number = 0;
      for (let i of data) {
        let dt = this.timeService.getDateTime(i.sentAt * 1000);
        i.time = dt.time + " " + dt.am_pm;
        if (maxRemoteUnix < i.sentAt) maxRemoteUnix = i.sentAt;
        this.messages.push(i);
      }
      this.syncMessages(maxRemoteUnix, data);

    });
  }

  getInitMessages(){
    if (this.connectionService.connection) {
      this.socket.emit('cl-getInitMessages', { employeeId: this.employees.currentId });
      this.loadLocalMessages(false);
    } else {
      this.loadLocalMessages(true);
    }
  }

  syncMessages(remoteUnix, remoteMessages) {
    return new Promise(resolve => {
      //import
      console.log("importing messages");
      for (let msg of remoteMessages) {
        let isMe = msg.isMe == true ? 1 : 0;
        this.database.db.executeSql('select time from message where time = ' + msg.sentAt, {}).then((data) => {
          if (data.rows.length == 0) {
            this.database.db.executeSql('insert into message(time, content, isMe) values(' + msg.sentAt + ', "' + msg.content + '", ' + isMe + ')');
          } else console.log("message exists in db. skipping..");
        }).catch(e => {
          console.log(e);
        });
      }

      //export
      this.database.db.executeSql("select * from message where time > " + remoteUnix, {}).then((data) => {
        if (data.rows.length > 0) {
          console.log("found unsent messages; exporting..");
          for (let i = 0; i < data.rows.length; i++) {
            let unix = data.rows.item(i).time;

            let nm = {
              content: data.rows.item(i).content,
              isMe: true,
              employeeId: this.employees.currentId,
              time: unix
            }

            this.socket.emit('cl-sendNewMessage', nm);
          }
        } else {
          console.log("no unsent message.");
        }
      });
    });
  }

  loadLocalMessages(willPush) {
    this.database.db.executeSql('select * from message order by time', {}).then((data) => {
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          let dt = this.timeService.getDateTime(data.rows.item(i).time * 1000);
          if (this.maxLocalUnix < data.rows.item(i).time) this.maxLocalUnix = data.rows.item(i).time
          if (willPush) {
            this.messages.push({
              "id": data.rows.item(i).messageId,
              "time": dt.time + " " + dt.am_pm,
              "date": dt.date,
              "content": data.rows.item(i).content,
              "isMe": data.rows.item(i).isMe
            });
          }
        }
      }
    }).catch(e => {
      console.log(e);
    });
  }

  getMessage() {
    let observable = new Observable(observer => {
      this.socket.on('sv-newMessage', (data) => {
        let dt = this.timeService.getDateTime(data.sentAt * 1000);
        let isMe = data.isMe == true ? 1 : 0;
        data.time = dt.time + " " + dt.am_pm;
        this.database.db.executeSql('insert into message(time, content, isMe) values(' + data.sentAt + ', "' + data.content + '", ' + isMe + ')', {}).then(() => {
          console.log("received messaged saved to local");
          if (data.isMe == false) this.triggerLocalNotif(data);
        }).catch(e => {
          console.log("failed to save received message");
        });
        observer.next(data);
      });
    });
    return observable;
  }

  triggerLocalNotif(data) {
    this.localNotif.schedule({
      title: 'New message from Admin',
      text: data.content
    });
  }
}
