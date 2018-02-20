import { Platform } from 'ionic-angular/platform/platform';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { EmployeesProvider } from '../employees/employees';
import { AuthProvider } from './../auth/auth';
import { DatabaseProvider } from './../database/database';
import { TimeProvider } from './../time/time';
import { SocketProvider } from '../socket/socket';
import { AccountProvider } from '../account/account';


@Injectable()
export class MessageProvider {
  messages = [];
  maxLocalUnix: number = 0;
  maxRemoteUnix: number = 0;
  messageSubscription : any;
  constructor(
    private employees     : EmployeesProvider,
    public http           : HttpClient,
    private timeService   : TimeProvider,
    private database      : DatabaseProvider,
    public localNotif     : LocalNotifications,
    private platform      : Platform,
    private auth          : AuthProvider,
    private socketService : SocketProvider,
    public accountService : AccountProvider
  ) {
    this.auth.isAuth.subscribe(x => {
      if(x){
        this.messageSubscription = this.getMessage().subscribe((data: { sentAt: number, isMe: boolean, time: string, content: string }) => {
          if (!data.isMe) {
            this.database.db.executeSql('insert into message(time, content, isMe) values(' + data.sentAt + ', "' + data.content + '", 0)', {}).then(() => {
              console.log("received messaged saved to local");
              this.triggerLocalNotif(data);
            }).catch(e => {
              console.log("failed to save received message");
            });
          }
    
          let dt = this.timeService.getDateTime(data.sentAt * 1000);
          data.time = dt.time + " " + dt.am_pm;
          this.messages.push(data);
        });
    
        this.socketService.socket.on('sv-sendInitMessages', (data) => {
          let c = 0;
          let d = data.messages.length;
          let temp = [];
          for (let i of data.messages) {
            let dt = this.timeService.getDateTime(i.sentAt * 1000);
            i.time = dt.time + " " + dt.am_pm;
            if (this.maxRemoteUnix < i.sentAt) this.maxRemoteUnix = i.sentAt;
            temp.push(i);
            if (++c == d) {
              this.messages = temp;
              this.database._dbready.subscribe((ready) => {
                // if (ready) {
                //   this.syncMessages(this.maxRemoteUnix, data);
                // }
              });
            }
          }
        });
      }else{
        if(this.messageSubscription != undefined) this.messageSubscription.unsubscribe();
      }
    });
  }

  requestInitMessages() {
    this.socketService.socket.emit('cl-getInitMessages');
  }

  getLocalMaxUnix() {
    return new Promise((resolve, reject) => {
      this.database.db.executeSql("select time from message order by time desc limit 1", {}).then((data) => {
        if (data.rows.length > 0) {
          resolve(data.rows.item(0).time);
        }
      }).catch(e => {
        reject(e);
      })
    });
  }

  getImportables(unix, messages) {
    return new Promise((resolve, reject) => {
      messages = messages.reverse();
      console.log(messages);
      messages.find((message, i) => {
        console.log(message.sentAt + " == " + unix);
        if (message.sentAt <= unix) {
          console.log("found");
          let arr = messages.slice(0, i);
          console.log(arr);
          resolve(arr);
          return true;
        }
      });
    });
  }

  syncMessages(remoteUnix, remoteMessages) {
    return new Promise(resolve => {
      this.platform.ready().then(() => {
        //import
        //get local unix
        this.getLocalMaxUnix().then((localMaxUnix) => {
          console.log("received max local unix : " + localMaxUnix);
          this.getImportables(localMaxUnix, remoteMessages).then((importables: Array<{ isMe: boolean, sentAt: number, content: string }>) => {
            if (importables.length > 0) {
              console.log("found new messages; importing;");
              for (let msg of importables) {
                let isMe = msg.isMe == true ? 1 : 0;
                console.log(msg.sentAt);
                this.database.db.executeSql('select time from message where time = ' + msg.sentAt, {}).then((data) => {
                  if (data.rows.length == 0) {
                    this.database.db.executeSql('insert into message(time, content, isMe) values(' + msg.sentAt + ', "' + msg.content + '", ' + isMe + ')', {}).then(() => {
                      console.log("message imported : " + msg.content);
                    });
                  } else console.log("message exists in db. skipping..");
                }).catch(e => {
                  console.log(e);
                });
              }
            } else console.log("messages updated; skipping import;");
          });
        });

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

              this.socketService.socket.emit('cl-sendNewMessage', nm);
            }
          } else {
            console.log("no unsent message.");
          }
        });
      });
    });
  }

  getLocalMessages() {
    console.log("getting local messages");
    this.platform.ready().then(() => {
      this.database._dbready.subscribe((ready) => {
        if (ready) {
          this.database.db.executeSql('select * from message inner join user on message.userId = user.id where user.userId = "'+ this.accountService.accountId +'" order by time', {}).then((data) => {
            let temp = [];
            if (data.rows.length > 0) {
              let c = 0;
              for (let i = 0; i < data.rows.length; i++) {
                let dt = this.timeService.getDateTime(data.rows.item(i).time * 1000);
                temp.push({
                  "id": data.rows.item(i).messageId,
                  "time": dt.time + " " + dt.am_pm,
                  "date": dt.date,
                  "content": data.rows.item(i).content,
                  "isMe": data.rows.item(i).isMe
                });
                if (++c == data.rows.length) this.messages = temp;
              }
            }
          }).catch(e => {
            console.log(e);
          });
        }
      });
    });
  }

  getMessage() {
    let observable = new Observable(observer => {
      this.socketService.socket.on('sv-newMessage', (data) => {
        observer.next(data);
      });
    });
    return observable;
  }

  saveMessage (unix, nm) {
    return this.database.db.executeSql('insert into message(time, content, isMe, userId) VALUES(' + unix + ', "' + nm.content + '", 1, '+ this.accountService.accountIntId +')', {});
  }

  triggerLocalNotif(data) {
    this.localNotif.schedule({
      title: 'New message from Admin',
      text: data.content
    });
  }
}
