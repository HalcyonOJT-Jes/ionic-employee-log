import { DatabaseProvider } from './../../providers/database/database';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import { EmployeesProvider } from './../../providers/employees/employees';
import { ClassGetter } from '@angular/compiler/src/output/output_ast';
import { TimeProvider } from '../../providers/time/time';
/**
 * Generated class for the RoomPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})
export class ChatPage {
  messages = [];
  message = '';
  typing = '';
  adminTyping = false;
  timeoutTyping: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private socket: Socket, private toastCtrl: ToastController, public employees : EmployeesProvider, public timeService : TimeProvider, public database : DatabaseProvider) {
    this.socket.emit('cl-requestMessages', { employeeId: this.employees.currentId});
    
    this.getMessages().subscribe(data => {
      this.messages.push(data);
      this.typing = '';
      this.adminTyping = false;
      
    });

    this.getTyping().subscribe(nickname =>{
      // this.typing = "...";
      setTimeout(() => {
      // this.typing = '';
      }, 2000);
    });
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
      time: dt.time + " " + dt.am_pm
    }

    let nm2 = Object.create(nm);
    nm2.time = unix;
    nm2.isMe = true;
    nm2.content = this.message;
    nm2.employeeId = this.employees.currentId;

    this.messages.push(nm);
    //save message to local database
    this.database.db.executeSql('insert into message(time, content, isMe) VALUES(' + unix + ', "' + nm.content + '", 1)', {}).then(() => {
      console.log("Messaged saved to local");
      this.socket.emit('cl-sendNewMessage', nm2);
      this.message = '';
    }).catch(e => {
      console.log(e);
    });
  }

  loadInitialMessages(){
    let observable = new Observable(observer => {
      this.socket.on('sv-sendRequestedMessages', (data) => {
        
      });
    });
  }

  getMessages(){
    let observable = new Observable(observer => {
      this.socket.on('sv-newMessageFromAdmin', (data) =>{
        let dt = this.timeService.getDateTime(data.sentAt * 1000);
        data.time = dt.time + " " + dt.am_pm;
        observer.next(data);
      });
    });
    return observable;
  }

  showToast(msg){
    let toast = this.toastCtrl.create({
      message : msg,
      duration : 2000
    });
    toast.present();
  }

  ionViewDidLoad(){
    this.socket.emit('clJoinRoom', {employeeId : "5a5f185480a25f2aac4abf20"});
  }
}