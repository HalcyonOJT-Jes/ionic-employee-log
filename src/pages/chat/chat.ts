import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import { EmployeesProvider } from './../../providers/employees/employees';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, private socket: Socket, private toastCtrl: ToastController, public employees : EmployeesProvider) {

    this.getMessages().subscribe(data => {
      this.messages.push(data);
      this.typing = '';
    });

    this.getTyping().subscribe(nickname =>{
      this.typing = "...";
      setTimeout(() => {
        this.typing = '';
      }, 2000);
    });
  }

  userTyping(){
    this.socket.emit('typing');
  }

  getTyping(){
    let obs = new Observable(obs => {
      this.socket.on('show-typing', (nickname) =>{
        obs.next(nickname);
      });
    });
    return obs;
  }

  sendMessage(){
    let nm = {
      content : this.message,
      isMe: true,
      employeeId : this.employees.currentId,
      time: (new Date).getTime()
    }
    
    this.socket.emit('cl-sendNewMessage', nm);
    this.messages.push(nm)
    this.message = '';
  }

  getMessages(){
    let observable = new Observable(observer => {
      this.socket.on('sv-newMessageFromAdmin', (data) =>{
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