import { DatabaseProvider } from './../database/database';
import { AccountProvider } from './../account/account';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Storage } from '@ionic/storage';
import { SocketProvider } from '../socket/socket';
import { ImageProvider } from '../image/image';

@Injectable()
export class AuthProvider {
  token: string;
  isAuth = new BehaviorSubject<boolean>(false);
  constructor(
    public http: HttpClient,
    public storage: Storage,
    public socketService: SocketProvider,
    public accountService: AccountProvider,
    public database: DatabaseProvider,
    public imageService: ImageProvider
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
              if (typeof userId === "string") {
                this.accountService.accountId = userId;
                return this.database.db.executeSql('select id, pic, userId from user where userId = "' + userId + '"', {}).then(data => {
                  if (data.rows.length > 0) {
                    this.accountService.accountIntId = data.rows.item(0).id;
                    this.accountService.accountIntId = data.rows.item(0).pic;
                    this.accountService.accountIntId = data.rows.item(0).userId;
                    
                    resolve(true); return;
                  } else {
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
        this.accountService.accountExists(data._id).then(exists => {
          console.log(data);
          if (!exists) {
            this.imageService.onlineUrlToB64(data.pic.thumb, true)
              .then((b64: string) => {
                let name = data.pic.thumb.split('/');
                name = name[name.length - 1].split('.')[0];
                console.log('name: ', name);
                return this.imageService.saveBase64(b64, name);
              })
              .catch(e => console.log(e))
              .then((filePath: string) => {
                console.log("User image saved : " + filePath);
                return this.accountService.saveUser(data._id, filePath);
              })
              .catch(e => console.log(e))
              .then(() => {
                return this.storage.set('userId', data._id);
              })
              .catch(e => console.log(e))
              .then(() => {
                console.log("Account saved.");
                resolve(true);
              });
          }else resolve(true)
        });
      }, err => {
        resolve(false);
      });
    });
  }

}