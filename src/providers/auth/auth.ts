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
            return this.storage.get('userId').then(userId => {
              console.log('userId: ', userId);
              if(typeof userId === "string"){
                this.accountService.accountId = userId;
                return this.database.db.executeSql('select id from user where userId = "'+ userId +'"', {}).then(data => {
                  if(data.rows.length > 0){
                    this.accountService.accountIntId = data.rows.item(0).id;
                    console.log('data.rows.item(0).id;: ', data.rows.item(0).id);
                    resolve(true); return;
                  }else{
                    console.log("yay");
                    resolve(false); return;
                  }
                }).catch(e => console.log(e))
              }
            })
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
        this.accountService.accountId = data._id;
        this.accountService.accountPic = data.pic.thumb;

        this.accountService.accountExists(data._id).then(exists => {
          if(!exists) this.accountService.saveUser(data._id, data.pic.thumb).catch(e => console.log(e));
        });

        this.storage.set('userId', data._id).then(() => {
          console.log("saved user id to local storage");
        });
        resolve(true);
      }, err => {
        resolve(false);
      });
    });
  }

}