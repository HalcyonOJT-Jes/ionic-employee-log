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
              this.getRemoteLogs(data).then((logs: Array<{}>) => {
                this.local_log = logs;
                if (logs.length > 0) {
                  this.findUnixMax().then((maxUnix) => {
                    this.syncLogs(maxUnix, logs).then((syncedLogs:any) => {
                      if(syncedLogs != false) this.local_log = syncedLogs;
                      this.showLogLoader = false;
                      this.showEmptyLog = false;
                      console.log("sync complete");
                    });
                  }).catch(e => console.log(e));
                } else {
                  this.showLogLoader = false;
                  this.showEmptyLog = true;
                  return;
                }
              }).catch(e => console.log(e));
            }
          });
        });
      } else {
        //resets log and timeinlist(for maxunix upon logout)
        this.local_log = [];
        this.time_in_list = [];
      }
    });
  }

  findUnixMax() {
    return new Promise((resolve, reject) => {
      if (this.time_in_list.length > 0) {
        let unixMax = this.time_in_list.reduce((a, b) => {
          return Math.max(a, b);
        });
        resolve(unixMax);
      } else {
        resolve(-1);
      }
    });
  }

  getCustomLogs(month) {
    // get existing logs
    this.database.db.executeSql('select * from log inner join user on log.userId = user.id where month = ' + month + ' and user.userId = "' + this.accountService.accountId + '" order by logId DESC', {}).then((data) => {
      this.custom_log = [];
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {

          this.custom_log.push({
            id: data.rows.item(i).logId,
            unix: data.rows.item(i).time,
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
          console.log("user id ", this.accountService.accountId);
          this.database.db.executeSql('select timeIn, formattedAddress, isSeen from log inner join user on log.userId = user.id where user.userId = "' + this.accountService.accountId + '" order by timeIn DESC', {}).then((data) => {
            let temp = [];
            if (data.rows.length > 0) {
              let c = 0;
              for (let i = 0; i < data.rows.length; i++) {
                temp.push({
                  unix: data.rows.item(i).timeIn,
                  map: {
                    formattedAddress: data.rows.item(i).formattedAddress
                  },
                  isSeen: data.rows.item(i).isSeen
                });
                if (++c == data.rows.length) this.local_log = temp;
              }
            } else console.log("log empty");
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
      console.log('data.length: ', data.length);

      if (data.length == 0) {
        resolve(temp);
        return;
      }
      let c = 0;
      let d = data.length;
      console.log('remote logs found: ', d);

      for (let log of data) {
        log.unix = log.timeIn;
        temp.push(log);
        //push to time in list to find for the max unix
        this.time_in_list.push(log.timeIn);
        if (++c == d) resolve(temp);
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

        this.database.db.executeSql('select timeIn, isSeen, logId from log where timeIn = ' + log.timeIn, {}).then(data => {
          if (data.rows.length == 0) {
            console.log("Found new remote logs.");
            this.database.db.executeSql('insert into log(logId, timeIn, month, lat, long, formattedAddress, batteryStatus, isSeen, userId) VALUES("' + log._id + '", ' + log.timeIn + ', ' + month + ', ' + log.map.lat + ', ' + log.map.lng + ', "' + log.map.formattedAddress + '", ' + log.batteryStatus + ', ' + isSeen + ', ' + this.accountService.accountIntId + ')', {}).then(() => {
              console.log('log saved to local.');
            }).catch(e => console.log(e));
          } else {
            for (let i = 0; i < data.rows.length; i++) {
              if (data.rows.item(i).isSeen != isSeen || data.rows.item(i).logId != log._id) {
                this.database.db.executeSql('update log set logId = "' + log._id + '", isSeen = ' + isSeen + ' where timeIn = ' + log.timeIn, {}).then((res) => {
                  console.log("log updated: " + log._id);
                }).catch(e => console.log(e));
              } else console.log("current log is updated; skipping.");
            }
          }
          if (++c == l) resolve();
        }).catch(e => console.log(e));
      }
    });
  }

  export(maxUnix) {
    return this.database.db.executeSql('select timeIn, long, lat, batteryStatus, log.id from log inner join user on log.userId = user.id where timeIn > ' + maxUnix + ' and user.userId = "' + this.accountService.accountId + '"', {})
      .then((data) => {
        this.exportMax = data.rows.length;

        if (data.rows.length > 0) {
          console.log('Exportable found : ', data.rows.length);
          let c = 0;
          for (let i = 0; i < data.rows.length; i++) {
            return this.database.db.executeSql('select file from log_images where logId = ' + data.rows.item(i).id, {}).then(data2 => {
              return new Promise((resolve, reject) => {
                if (data2.rows.length > 0) {
                  let d = 0;
                  let b64s = [];
                  for (let i = 0; i < data2.rows.length; i++) {
                    let data = this.imageService.extractPathAndFile(data2.rows.item(i).file);
                    data.file = data.file.replace(' ', '%20');
                    this.imageService.urlToB64(data.path, data.file).then(b64 => {
                      b64s.push(b64);
                      if (++d == data2.rows.length) resolve(b64s);
                    }).catch(e => console.log(e));
                  }
                } else resolve();
              })
            }).catch(e => {
              console.log(e);
            }).then(b64s => {
              return new Promise((resolve, reject) => {
                console.log("sending local log to server");
                if (b64s.length <= 0) {
                  console.log("no log image;");
                  return false;
                }
                //send log to server
                this.socketService.socket.emit('cl-timeIn', {
                  employeeId: this.employeeService.currentId,
                  timeIn: data.rows.item(i).timeIn,
                  pics: b64s,
                  map: {
                    lng: data.rows.item(i).long,
                    lat: data.rows.item(i).lat
                  },
                  batteryStatus: data.rows.item(i).batteryStatus
                }, (respData) => {
                  let logs = this.exportedLogEntry(respData);
                  if (++c == data.rows.length) resolve(logs);
                });
              });
            });
          }
        } else return false;
      });
  }

  syncLogs(maxUnix, remoteLogs) {
    return new Promise((resolve, reject) => {
      if (maxUnix == -1) {
        resolve();
        return;
      }

      this.import(remoteLogs).then(() => {
        return this.export(maxUnix);
      }).then(logs => {
        resolve(logs);
      }).catch(e => {
        console.log(e);
      });
    });
  }

  requestRemoteLogs() {
    this.socketService.socket.emit('cl-getInitNotifEmployee');
  }

  trackLog(index, log) {
    return log.timeIn;
  }

  exportedLogEntry (data) {
    let a = 0;
    let temp = this.local_log;
    temp.find((x, i) => {
      if(x.unix == data.timeIn){
        a = i;
        return true;
      }
    });

    let log = {
      _id : data.id,
      unix : data.timeIn,
      map : {
        formattedAddress : data.formattedAddress
      },
      isSeen : false
    }

    temp.splice(a,1, log);
    console.log("logs updated");
    return temp;
  }

  logEntry(data) {
    if (data.id) {
      let temp = this.local_log;
      temp = temp.filter(x => {
        return x.hasOwnProperty('_id');
      });

      temp.unshift({
        _id: data.id,
        unix: data.timeIn,
        map: {
          formattedAddress: data.formattedAddress
        },
        isSeen: false
      });
      return temp;
    }
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