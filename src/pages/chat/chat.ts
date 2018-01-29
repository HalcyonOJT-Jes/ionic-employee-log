import { MessageProvider } from './../../providers/message/message';
import { DatabaseProvider } from './../../providers/database/database';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import { EmployeesProvider } from './../../providers/employees/employees';
import { ClassGetter } from '@angular/compiler/src/output/output_ast';
import { TimeProvider } from '../../providers/time/time';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, private socket: Socket, public employees : EmployeesProvider, public timeService : TimeProvider, public database : DatabaseProvider, private messageService : MessageProvider, private push : Push, private platform : Platform) {
    this.platform.ready().then(() => {
      this.push.hasPermission().then((res : any) => {
        if(res.isEnabled){
          console.log("we have permission");
          this.push.createChannel({
            id : "chat_channel",
            description : "channel for chat notifications",
            importance : 5
          }).then(() => {
            console.log("channel created");
            this.initializePushNotifs();
          }).catch(e => {
            console.log(e);
          });
        }else{
          console.log("we don't have permission");
        }
      }).catch(e => {
        console.log(e);
      });
    });

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

  initializePushNotifs () {
    const options : PushOptions = {
      android : {
        senderID : "282096607572"
      },
      ios : {
        alert : 'true',
        badge : true,
        sound : 'true'
      },
      windows : {}
    };
    
    const pushObject : PushObject = this.push.init(options);
    pushObject.on('notification').subscribe((notification : any) => console.log('Received notification', notification));
    pushObject.on('registration').subscribe((registration : any) => console.log('Device registered', registration.registrationId));
    pushObject.on('error').subscribe(error => console.error('Error : ', error));
  }

  scrollToBottom(){
    let d = this.content.getContentDimensions();
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