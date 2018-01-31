import { MessageProvider } from './../../providers/message/message';
import { DatabaseProvider } from './../../providers/database/database';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import { EmployeesProvider } from './../../providers/employees/employees';
import { TimeProvider } from '../../providers/time/time';
import { Platform } from 'ionic-angular/platform/platform';

@IonicPage()
@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})
export class ChatPage {
  @ViewChild(Content) content : Content;
  message = '';
  typing = '';
  adminTyping = false;
  timeoutTyping: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private socket: Socket, public employees : EmployeesProvider, public timeService : TimeProvider, public database : DatabaseProvider, private messageService : MessageProvider, private platform : Platform) {

    this.messageService.getMessage().subscribe(data => {
      this.typing = '';
      this.adminTyping = false;
      this.scrollToBottom();
    });

    this.getTyping().subscribe(nickname =>{
      this.scrollToBottom();
      setTimeout(() => {
      }, 2000);
    });
  }

  scrollToBottom(){
    this.content.scrollToBottom();
  }

  userTyping(){
    this.socket.emit('cl-typing', {isEmployee: true});
    console.log('Im typing');
  }

  typeTimeout(){
   this.timeoutTyping = setTimeout(() => {
      this.adminTyping = false;
      console.log('stopped typing');
      }, 1000);
  }

  getTyping(){
    let obs = new Observable(obs => {
      this.socket.on('sv-adminTyping', (nickname) =>{
        this.adminTyping = true;
        console.log('still typing');
        clearTimeout(this.timeoutTyping);
        this.typeTimeout();
       
        obs.next(nickname);
      });
    });
    return obs;
  }

  sendMessage(){
    let unix = this.timeService.curUnix;
    let dt = this.timeService.getDateTime(unix * 1000);

    let nm = {
      content : this.message,
      isMe: true,
      employeeId : this.employees.currentId,
      time : dt.time + " " + dt.am_pm
    }

    let nm2 = {
      content : this.message,
      isMe: true,
      employeeId : this.employees.currentId,
      time : unix
    }

    // this.messageService.messages.push(nm);
    //save message to local database
    this.database.db.executeSql('insert into message(time, content, isMe) VALUES(' + unix + ', "' + nm.content + '", 1)', {}).then(() => {
      console.log("Messaged saved to local");
      this.socket.emit('cl-sendNewMessage', nm2);
      this.message = '';
      this.scrollToBottom();
    }).catch(e => {
      console.log(e);
    });
  }

  ionViewDidLoad(){
    this.socket.emit('clJoinRoom', {employeeId : "5a5f185480a25f2aac4abf20"});
  }

  ionViewDidEnter(){
    this.scrollToBottom();
  }
}