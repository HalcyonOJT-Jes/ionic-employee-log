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
  messageSubscription: any;
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
      if (x) {
        this.messageSubscription = this.getMessage().subscribe((data: { _id: string, sentAt: number, isMe: boolean, time: string, content: string, unix : number, seenAt : number }) => {
          console.log(data);
          if (!data.isMe) {
            this.database.db.executeSql('insert into message(time, _id, content, isMe, seenAt) values(' + data.sentAt + ',"'+ data._id +'", "' + data.content + '", 0, '+ data.seenAt +')', {}).then(() => {
              console.log("received messaged saved to local");
              this.triggerLocalNotif(data);
            }).catch(e => {
              console.log("failed to save received message");
            });
          }else{
            this.database.db.executeSql('update message set _id = "'+ data._id +'" where content="'+ data.content +'"').then(() => {
              console.log("local message updated : id set");
            });
          }

          data.unix = data.sentAt;
          this.messages.push(data);
        });

        this.socketService.socket.on('sv-sendInitMessages', (data) => {
          let c = 0;
          let d = data.messages.length;
          let temp = [];
          for (let msg of data.messages) {
            msg.unix = msg.sentAt;
            if (this.maxRemoteUnix < msg.sentAt) this.maxRemoteUnix = msg.sentAt;
            temp.unshift(msg);
            if (++c == d) {
              this.messages = temp;
              this.database._dbready.subscribe((ready) => {
                if (ready) {
                  this.syncMessages(this.maxRemoteUnix, data.messages);
                }
              });
            }
          }
        });
      } else {
        if (this.messageSubscription != undefined) this.messageSubscription.unsubscribe();
        this.messages = [];
        this.maxLocalUnix = 0;
        this.maxRemoteUnix = 0;
      }
    });
  }

  requestInitMessages() {
    this.socketService.socket.emit('cl-getInitMessages');
  }

  getLocalMaxUnix() {
    return new Promise((resolve, reject) => {
      this.database.db.executeSql('select time from message inner join user on message.userId = user.id where user.userId = "' + this.accountService.accountId + '" order by time desc limit 1', {}).then((data) => {
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
          this.getImportables(localMaxUnix, remoteMessages).then((importables: Array<{ _id : string, isMe: boolean, sentAt: number, content: string, seenAt : number }>) => {
            if (importables.length > 0) {
              console.log("found new messages; importing;");
              for (let msg of importables) {
                let isMe = msg.isMe == true ? 1 : 0;
                this.database.getUserIntId(this.accountService.accountId).then((userId : number) => {
                  this.database.db.executeSql('insert into message(time, _id, userId, content, isMe, seenAt) values(' + msg.sentAt + ', "'+ msg._id +'", '+ userId +' , "' + msg.content + '", ' + isMe + ', '+ msg.seenAt +')', {}).then(() => {
                    console.log("message imported : " + msg.content);
                  }).catch(e => console.log(e));
                }).catch(e => console.log(e));
              }
            } else console.log("messages updated; skipping import;");
          });
        });

        //export
        this.database.db.executeSql('select * from message inner join user on message.userId = user.id where time > ' + remoteUnix + ' and user.userId = "' + this.accountService.accountId + '"' , {}).then((data) => {
          if (data.rows.length > 0) {
            console.log("found unsent messages; exporting..");
            for (let i = 0; i < data.rows.length; i++) {
              let unix = data.rows.item(i).time;

              let nm = {
                content: data.rows.item(i).content,
                isMe: true,
                time: unix
              }

              this.socketService.socket.emit('cl-sendNewMessage', nm);
            }
          } else {
            console.log("no unsent message.");
          }
        }).catch(e => console.log(e));
      });
    });
  }

  getLocalMessages() {
    console.log("getting local messages");
    this.platform.ready().then(() => {
      this.database._dbready.subscribe((ready) => {
        if (ready) {
          this.database.db.executeSql('select * from message inner join user on message.userId = user.id where user.userId = "' + this.accountService.accountId + '" order by time', {}).then((data) => {
            let temp = [];
            if (data.rows.length > 0) {
              let c = 0;
              for (let i = 0; i < data.rows.length; i++) {
                temp.push({
                  id: data.rows.item(i).messageId,
                  unix: data.rows.item(i).time,
                  content: data.rows.item(i).content,
                  isMe: data.rows.item(i).isMe
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

  saveMessage(unix, nm) {
    return this.database.db.executeSql('insert into message(time, content, isMe, userId) VALUES(' + unix + ', "' + nm.content + '", 1, ' + this.accountService.accountIntId + ')', {});
  }

  triggerLocalNotif(data) {
    this.localNotif.schedule({
      title: 'New message from Admin',
      text: data.content
    });
  }
}
