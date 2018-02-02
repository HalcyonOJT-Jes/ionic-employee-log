import { Socket } from 'ng-socket-io';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { DatabaseProvider } from '../../providers/database/database';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  demos = [
    {
      id: 1,
      name: "Demo 1",
      profiles: [
        {
          id: 11,
          username: 'EdSheeran',
          password: 'edsheeran'
        },
        {
          id: 12,
          username: 'TaylorSwift',
          password: 'taylorswift'
        }
      ]
    },
    {
      id: 2,
      name: "Demo 2",
      profiles: [
        {
          id: 21,
          username: 'MartinJensen',
          password: 'martinjensen'
        },
        {
          id: 22,
          username: 'BrunoMars',
          password: 'brunomars'
        }
      ]
    },
    {
      id: 3,
      name: "Demo 3",
      profiles: [
        {
          id: 31,
          username: 'CalvinHarris',
          password: 'calvinharris'
        },
        {
          id: 32,
          username: 'FrankSinatra',
          password: 'franksinatra'
        }
      ]
    },
    {
      id: 4,
      name: "Demo 4",
      profiles: [
        {
          id: 41,
          username: 'EdgarSandoval',
          password: 'edgarsandoval'
        },
        {
          id: 42,
          username: 'ZaraLarsson',
          password: 'zaralarsson'
        }
      ]
    },
  ];


  constructor(public navCtrl: NavController, private alrtCtrl: AlertController, private socket: Socket, private database: DatabaseProvider) {
    this.getDemos().subscribe((data: { id: number, name: string, profiles: Array<{ id: number, username: string, password: string }> }) => {
      this.demos.push(data);
    });
  }

  startDemo(id, name) {
    this.alrtCtrl.create({
      title: name,
      inputs: [
        {
          name: 'username',
          placeholder: 'Username',
        },
        {
          name: 'password',
          placeholder: 'Password',
          type: 'password'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Login',
          handler: data => {
            this.authenticateUser(data.username, data.password, id).then((userId) => {
              //show success login
              this.alrtCtrl.create({
                title: 'Success!',
                buttons: [
                  {
                    text: 'Ok',
                    handler: () => {
                      this.navCtrl.setRoot('HomePage');
                    }
                  }
                ]
              }).present();

              //check if account exists; if not, save;
              
            }).catch(e => {
              console.log(e);
              return false;
            })
            // this.socket.emit('cl-requestLogin', {
            //   demoId: id,
            //   username: data.username,
            //   password: data.password
            // }, (response) => {
            //   if (response) {
            //     //login success
            //     this.alrtCtrl.create({
            //       title : 'Success!',
            //       buttons: [
            //         {
            //           text : 'Ok',
            //           handler : () => {
            //             this.navCtrl.setRoot('HomePage');
            //           }
            //         }
            //       ]
            //     });
            //     //setroot page to home
            //     //save account to local
            //   } else {
            //     //alert login failed
            //     return false;
            //   }
            // });
          }
        }
      ]
    }).present();
  }

  checkAccExist() {

  }

  authenticateUser(user: string, pass: string, demoId: number) {
    return new Promise((resolve, reject) => {
      this.findDemo(demoId).then((demo) => {
        this.findUser(demo, user).then((profile: { id: number, password: string, username: string }) => {
          console.log(profile.password + " = " + pass);
          if (profile.password == pass) resolve(profile.id);
          else throw "login failed";
        })
      });
    });
  }

  findUser(demo, user) {
    return new Promise(resolve => {
      resolve(demo.profiles.find((profile) => {
        return profile.username === user;
      }));
    });
  }

  findDemo(demoId) {
    return new Promise(resolve => {
      resolve(this.demos.find((demo) => {
        return demo.id === demoId;
      }));
    });
  }

  getDemos() {
    let obs = new Observable((observable) => {
      this.socket.on('sv-sendDemos', (data) => {
        observable.next(data);
      });
    });
    return obs;
  }
}
