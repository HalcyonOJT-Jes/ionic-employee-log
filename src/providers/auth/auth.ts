import { DatabaseProvider } from './../database/database';
import { AccountProvider } from './../account/account';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Storage } from '@ionic/storage';
import { SocketProvider } from '../socket/socket';

@Injectable()
export class AuthProvider {
  token: string;
  isAuth = new BehaviorSubject<boolean>(false);
  constructor(
    public http           : HttpClient,
    public storage        : Storage,
    public socketService  : SocketProvider,
    public accountService : AccountProvider,
    public database       : DatabaseProvider
  ) {
    this.isAuth.subscribe(x => {
      if (x) {
        console.log("ready for connection");
        this.socketService.socket = this.socketService.io(this.socketService.serverAddress, {
          query: {
            token: this.token
          }
        });
        this.socketService.socket.connect();
      }
    });
  }

  authenticate(user, pass) {
    return new Promise((resolve, reject) => {
      this.http.post(this.socketService.serverAddress + '/authenticate',
        {
          username: user,
          password: pass
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }).subscribe((data: any) => {
          if (data.success) {
            resolve({
              token: data.token,
              success: true
            });
          } else {
            resolve({
              msg: data.msg
            });
          }
        });
    });
  }

  checkExistingToken(b) {
    return new Promise((resolve, reject) => {
      this.storage.get('token').then(token => {
        if (typeof token === "string") {
          //skip token validation if false; continue otherwise;
          if (!b) {
            resolve(true);
            return;
          }

          this.validateToken(token).then(valid => {
            if (valid) resolve(true); else resolve(false);
          });
        } else resolve(false);
      }).catch(e => {
        console.log(e);
      })
    });
  }

  validateToken(token) {
    return new Promise((resolve, reject) => {
      this.token = token;
      this.http.post(this.socketService.serverAddress + '/check-authentication', {}, {
        headers: new HttpHeaders({
          Authorization: 'JWT ' + token,
          'Content-Type': 'applicaton/json'
        })
      }).subscribe((data: any) => {
        this.accountService.accountPic = data.pic.thumb;
        resolve(true);
      }, err => {
        resolve(false);
      });
    });
  }

  accountExists(userId : string){
    return new Promise((resolve, reject) => {
      this.database.db.executeSql('select count(*) from user where userId = ' + userId, {}).then(data => {
        if(data.rows.length > 0) resolve(true); else resolve(false);
      }).catch(e => console.log(e));
    });
  }

  saveUser(userId : string, pic : string){
    return new Promise((resolve, reject) => {
      this.database.db.executeSql('insert into user(userId, pic) values("'+ userId +'", "'+ pic +'")', {}).then(() => {
        console.log("User : " + userId + " saved to database.");
        resolve(true);
      }).catch(e => console.log(e));
    });
  }
}