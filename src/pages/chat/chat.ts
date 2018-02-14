import { SocketProvider } from './../../providers/socket/socket';
import { ConnectionProvider } from './../../providers/connection/connection';
import { MessageProvider } from './../../providers/message/message';
import { DatabaseProvider } from './../../providers/database/database';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, ToastController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { TimeProvider } from '../../providers/time/time';
import { AccountProvider } from '../../providers/account/account';

@IonicPage()
@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})
export class ChatPage {
  @ViewChild(Content) content: Content;
  message = '';
  typing = '';
  adminTyping = false;
  timeoutTyping: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public timeService: TimeProvider, public database: DatabaseProvider, private messageService: MessageProvider, private connectionService: ConnectionProvider, private toast: ToastController, public socketService : SocketProvider, public accountService : AccountProvider) {

    this.messageService.getMessage().subscribe(() => {
      this.typing = '';
      this.adminTyping = false;
      this.scrollToBottom();
    });

    this.getTyping().subscribe(nickname => {
      this.scrollToBottom();
      setTimeout(() => {
      }, 2000);
    });
  }

  scrollToBottom() {
    this.content.scrollToBottom();
  }

  userTyping() {
    this.socketService.socket.emit('cl-typing', { isEmployee: true });
  }

  typeTimeout() {
    this.timeoutTyping = setTimeout(() => {
      this.adminTyping = false;
      console.log('stopped typing');
    }, 1000);
  }

  getTyping() {
    let obs = new Observable(obs => {
      this.socketService.socket.on('sv-adminTyping', (nickname) => {
        this.adminTyping = true;
        console.log('still typing');
        clearTimeout(this.timeoutTyping);
        this.typeTimeout();

        obs.next(nickname);
      });
    });
    return obs;
  }

  sendMessage() {
    let unix = this.timeService.curUnix;
    let dt = this.timeService.getDateTime(unix * 1000);

    let nm = {
      content: this.message
    }

    let nm2 = {
      content: this.message,
      isMe: true,
      time: dt.time + " " + dt.am_pm
    }

    //save message to local database
    this.database.db.executeSql('insert into message(time, content, isMe) VALUES(' + unix + ', "' + nm.content + '", 1)', {}).then(() => {
      console.log("Messaged saved to local");
      if (this.connectionService.connection) {
        this.socketService.socket.emit('cl-sendNewMessage', nm, (res) => {
          console.log(res);
        });
        console.log("message sent to server");
      } else {
        console.log("connection to the serve cannot be established. message will be sent later.");
        this.messageService.messages.push(nm2);
        this.toast.create({
          message: 'Connection to server cannot be established. Message will be sent once connected.',
          duration: 3000,
          position: 'top'
        }).present();
      }
      
    }).catch(e => {
      console.log(e);
    }).then(() => {
      this.message = '';
      this.scrollToBottom();
    });
  }

  ionViewDidLoad() {
  }

  ionViewDidEnter() {
    this.scrollToBottom();
  }

  trackByFn(index, item) {
    return index;
  }
}