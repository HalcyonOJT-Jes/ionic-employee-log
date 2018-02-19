import { ImageProvider } from './../image/image';
import { EmployeesProvider } from './../employees/employees';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TimeProvider } from './../time/time';
import { DatabaseProvider } from '../database/database';
import { Platform } from 'ionic-angular/platform/platform';
import { Observable } from 'rxjs/Observable';
import { ToastController } from 'ionic-angular/components/toast/toast-controller';
import { AuthProvider } from './../auth/auth';
import { SocketProvider } from '../socket/socket';
import { AccountProvider } from '../account/account';

@Injectable()
export class LogProvider {
  showEmptyLog: boolean = false;
  showLogLoader: boolean = false;
  local_log = [];
  custom_log = [];
  time_in_list = [];
  unixMax: any;
  exportCounter: number = 0;
  exportMax: number;
  syncStart = this.toast.create({
    message: 'Syncing logs.',
    duration: 3000
  });

  syncEnd = this.toast.create({
    message: 'Log sync complete.',
    duration: 3000
  })

  logEntrySubscription: any;

  constructor(
    public http: HttpClient,
    public timeService: TimeProvider,
    public database: DatabaseProvider,
    private employeeService: EmployeesProvider,
    private toast: ToastController,
    private platform: Platform,
    private auth: AuthProvider,
    private socketService: SocketProvider,
    private imageService: ImageProvider,
    public accountService: AccountProvider
  ) {
    console.log("Hello Log Provider");
    this.auth.isAuth.subscribe(x => {
      if (x) {
        this.socketService.socket.on('sv-notifSeen', (logId) => {
          let temp_log = this.local_log;

          temp_log.find((o, i) => {
            console.log(o._id + " = " + logId.id);
            if (o._id === logId.id) {
              temp_log[i].isSeen = true;
              this.local_log = temp_log;
              return true;
            }
          });
        });

        this.socketService.socket.on('sv-sendInitNotif', data => {
          this.showLogLoader = true;
          console.log("received initial logs");
          this.database._dbready.subscribe((ready) => {
            if (ready) {
              console.log("yay");
              this.getRemoteLogs(data).then((logs: Array<{}>) => {
                this.local_log = logs;
                if (this.local_log.length == 0) {
                  this.showLogLoader = false;
                  this.showEmptyLog = true;
                  return;
                }

                this.showLogLoader = false;
                this.showEmptyLog = false;

                this.findUnixMax().then((maxUnix) => {
                  console.log("max unix received : " + maxUnix);

                  // this.syncLogs(maxUnix, logs).then(() => {
                  //   this.local_log = logs;
                  //   console.log("sync complete");
                  // });
                }).catch(e => console.log(e));
              }).catch(e => console.log(e));
            }
          });
        });

        this.logEntrySubscription = this.logEntry().subscribe((data: { id: string, timeIn: number, formattedAddress: string }) => {
          if (++this.exportCounter == this.exportMax) {
            this.syncEnd.present();
          }

          if (data.id) {
            console.log("pushing log to log array");
            this.local_log = this.local_log.filter(x => {
              return x.hasOwnProperty('_id');
            });

            this.pushLog(data.id, data.timeIn, data.formattedAddress);

          }
        });
      } else {
        if (this.logEntrySubscription != undefined) this.logEntrySubscription.unsubscribe();
      }
    });
  }

  findUnixMax() {
    return new Promise((resolve, reject) => {
      let unixMax = this.time_in_list.reduce((a, b) => {
        return Math.max(a, b);
      });
      resolve(unixMax);
    });
  }

  getCustomLogs(month) {
    // get existing logs
    this.database.db.executeSql('select * from log inner join user on log.userId = user.id where month = ' + month + ' and user.userId = "' + this.accountService.accountId + '" order by logId DESC', {}).then((data) => {
      this.custom_log = [];
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          let dt = this.timeService.getDateTime(data.rows.item(i).time * 1000);

          this.custom_log.push({
            id: data.rows.item(i).logId,
            time: dt.time + " " + dt.am_pm,
            date: dt.date,
            map: {
              formattedAddress: data.rows.item(i).location
            },
            isSeen: data.rows.item(i).isSeen
          });
        }
      }
    }).catch(e => {
      console.log(e);
    });
  }

  getLocalLogs() {
    console.log("getting local logs");
    // get existing logs
    this.platform.ready().then(() => {
      this.database._dbready.subscribe((ready) => {
        if (ready) {
          this.database.db.executeSql('select timeIn, formattedAddress, isSeen from log inner join user on log.userId = user.id where user.userId = "' + this.accountService.accountId + '" order by timeIn DESC', {}).then((data) => {
            let temp = [];
            if (data.rows.length > 0) {
              let c = 0;
              for (let i = 0; i < data.rows.length; i++) {
                let dt = this.timeService.getDateTime(data.rows.item(i).timeIn * 1000);

                temp.push({
                  time: dt.time + " " + dt.am_pm,
                  date: dt.date,
                  map: {
                    formattedAddress: data.rows.item(i).formattedAddress
                  },
                  isSeen: data.rows.item(i).isSeen
                });
                if (++c == data.rows.length) this.local_log = temp;
              }
            }
          }).catch(e => {
            console.log(e);
          });
        }
      });
    });
  }

  getRemoteLogs(data) {
    return new Promise((resolve, reject) => {
      let temp = [];
      if (data.length == 0) {
        resolve(temp);
        return;
      }
      for (let log of data) {
        let dt = this.timeService.getDateTime(log.timeIn * 1000)
        log.time = dt.time + " " + dt.am_pm;
        log.date = dt.date;
        temp.push(log);
        //push to time in list to get the max unix
        this.time_in_list.push(log.timeIn);
        resolve(temp);
      }
    });
  }

  import(remoteLogs) {
    return new Promise(resolve => {
      let c = 0;
      let l = remoteLogs.length;
      for (let log of remoteLogs) {
        let month = new Date(log.timeIn).getMonth();
        let isSeen = log.isSeen == true ? 1 : 0;

        this.database.db.executeSql('select timeIn, isSeen, logId from log where timeIn = ' + log.timeIn, {}).then((data) => {
          if (data.rows.length == 0) {
            this.database.db.executeSql('insert into log(logId, timeIn, month, lat, long, formattedAddress, batteryStatus, isSeen, userId) VALUES("' + log._id + '", ' + log.timeIn + ', ' + month + ', ' + log.map.lat + ', ' + log.map.lng + ', "' + log.map.formattedAddress + '", ' + log.batteryStatus + ', ' + isSeen + ', ' + this.accountService.accountIntId + ')', {}).then(() => {
              console.log('log saved to local.');
            }).catch(e => {
              console.log(e);
            });
          } else {
            for (let i = 0; i < data.rows.length; i++) {
              if (data.rows.item(i).isSeen != isSeen || data.rows.item(i).logId != log._id) {
                this.database.db.executeSql('update log set logId = "' + log._id + '", isSeen = ' + isSeen + ' where timeIn = ' + log.timeIn, {}).then((res) => {
                }).catch(e => {
                  console.log(e);
                });
              } else console.log("current log is updated; skipping.");
            }
          }
          if (++c == l) resolve();
        }).catch(e => {
          console.log(e);
        });
      }
    });
  }

  export(maxUnix) {
    return new Promise(resolve => {
      this.database.db.executeSql('select timeIn, long, lat, batteryStatus, log.id from log inner join user on log.userId = user.id where timeIn > ' + maxUnix + ' and user.userId = "' + this.accountService.accountId + '"', {}).then((data) => {
        this.exportMax = data.rows.length;
        let b64s = [];
        
        if (data.rows.length > 0) {
          console.log("exportMax > 0");
          for (let i = 0; i < data.rows.length; i++) {
            this.database.db.executeSql('select file from log_images where logId = ' + data.rows.item(i).id, {}).then(data2 => {
                return new Promise((resolve, reject) => {
                  if (data2.rows.length > 0) {
                    let c = 0;
                    for (let i = 0; i < data2.rows.length; i++) {
                      this.imageService.blobToB64(data.rows.item(i).file).then(b64 => {
                        b64s.push(b64);
                        if (++c == data2.rows.length) resolve();
                      }).catch(e => console.log(e));
                    }
                  }
                })
              }).catch(e => {
                console.log(e);
              }).then(() => {
                console.log("sending local log to server");
                console.log("converting png to base64");
                this.imageService.blobToB64(data.rows.item(i).pic).then((b64) => {
                  console.log("image converted to b64; now uploading to server.");

                  //send log to server
                  this.socketService.socket.emit('cl-timeIn', {
                    employeeId: this.employeeService.currentId,
                    timeIn: data.rows.item(i).timeIn,
                    pic: b64s,
                    map: {
                      lng: data.rows.item(i).long,
                      lat: data.rows.item(i).lat
                    },
                    batteryStatus: data.rows.item(i).batteryStatus
                  });
                });
              });
          }
        } else {
          console.log("exportMax  < 0");
          this.syncEnd.present();
          resolve();
        }
      });
    });
  }

  syncLogs(maxUnix, remoteLogs) {
    return new Promise((resolve, reject) => {
      this.syncStart.present();
      this.import(remoteLogs).then(() => {
        this.export(maxUnix).then(() => {
          console.log("export -> then");
          resolve();
        }).catch(e => {
          console.log(e);
        });
      }).catch(e => {
        console.log(e);
      });
    });
  }

  requestRemoteLogs() {
    this.socketService.socket.emit('cl-getInitNotifEmployee');
  }

  trackLog(index, log) {
    return index;
  }

  logEntry() {
    let obs = new Observable((observable) => {
      this.socketService.socket.on('sv-successTimeIn', (data) => {
        observable.next(data);
      });
    });
    return obs;
  }

  pushLog(id, t, location) {
    //push to log array
    let dt = this.timeService.getDateTime(t * 1000);
    this.local_log.unshift({
      _id: id,
      time: dt.time + " " + dt.am_pm,
      date: dt.date,
      map: {
        formattedAddress: location
      },
      isSeen: false
    });
    console.log("log pushed");
  }

  saveLog(t, lat, long, loc, batt) {
    return new Promise((resolve, reject) => {
      this.database.db.executeSql('insert into log(timeIn, month, lat, long, formattedAddress, batteryStatus, userId) VALUES(' + t + ', ' + this.timeService.getCurMonth() + ', ' + lat + ', ' + long + ', "' + loc + '",' + batt + ', ' + this.accountService.accountIntId + ')', {}).then(() => {
        this.database.getLastInsert('log').then((id: number) => {
          resolve(id);
        }).catch(e => console.log(e));
      }).catch(e => console.log(e));
    })
  }
}
