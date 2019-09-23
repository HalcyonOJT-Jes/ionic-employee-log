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
    public http: HttpClient,
    public storage: Storage,
    public socketService: SocketProvider,
    public accountService: AccountProvider,
    public database: DatabaseProvider
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

  checkExistingToken(hasConnection) {
    return this.storage.get('token').then(token => {
      this.token = token;
      if (typeof token === 'string') {
        //if no connection, skip token validation; continue otherwise;
        if (!hasConnection) return this.loginOffline();
        else{
          return this.validateToken(token).then(res => {
            console.log(res);
            switch(res){
              case -1 : 
                return this.loginOffline();
              case 1  : return true;
              default : return false;
            }
          });
        }
      }else return false;
    })
  }

  validateToken(token) {
    return new Promise((resolve, reject) => {
      this.http.post(this.socketService.serverAddress + '/check-authentication', {}, {
        headers: new HttpHeaders({
          Authorization: 'JWT ' + token,
          'Content-Type': 'applicaton/json'
        })
      }).subscribe((data: any) => { 
        console.log("VALIDATED :", data);
        
        this.accountService.accountExists(data._id).then(exists => {
          if (!exists) {
            this.accountService.saveUserImage(data.pic.thumb)
            .then((filePath: string) => {
              console.log("User image saved : " + filePath);
              return this.accountService.saveUser(data._id, filePath);
            })
            .then(() => {
              return this.storage.set('userId', data._id);
            })
            .then(() => {
              console.log("Account saved.");
              resolve(1)
            })
            .catch(e => console.log(e));
          } else resolve(1)
        }).catch(e => console.log(e));
      }, err => resolve(-1));
    });
  }

  loginOffline() {
    return this.storage.get('userId').then(userId => {
      if (typeof userId === "string") {
        this.accountService.accountId = userId;
        return this.database.db.executeSql('select id, pic, userId from user where userId = "' + userId + '"', {});
      }
    }).then(data => {
      if (data.rows.length > 0) {
        this.accountService.accountIntId = data.rows.item(0).id;
        this.accountService.accountPic = data.rows.item(0).pic;
        return true;
      } else return false;
    });
  }
}