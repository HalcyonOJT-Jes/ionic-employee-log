import { EmployeesProvider } from './../employees/employees';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TimeProvider } from './../time/time';
import { DatabaseProvider } from '../database/database';
import { Platform } from 'ionic-angular/platform/platform';
import { Base64 } from '@ionic-native/base64';
import { Observable } from 'rxjs/Observable';
import { ToastController } from 'ionic-angular/components/toast/toast-controller';
import { AuthProvider } from './../auth/auth';
import { SocketProvider } from '../socket/socket';

@Injectable()
export class LogProvider {
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

  logEntrySubscription : any;

  constructor(private base64: Base64, public http: HttpClient, public timeService: TimeProvider, public database: DatabaseProvider,  private employeeService: EmployeesProvider, private toast: ToastController, private platform: Platform, private auth: AuthProvider, private socketService : SocketProvider) {
    console.log("Hello Log Provider");
    this.auth.isAuth.subscribe(x => {
      if(x) {
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
          console.log("received initial logs");
          this.database._dbready.subscribe((ready) => {
            if (ready) {
              this.getRemoteLogs(data).then((logs: Array<{}>) => {
                this.findUnixMax().then((maxUnix) => {
                  console.log("max unix received : " + maxUnix);
                  this.syncLogs(maxUnix, logs).then(() => {
                    this.local_log = logs;
                    console.log("sync complete");
                  });
                });
              });
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
              console.log(x);
              return x.hasOwnProperty('_id');
            });
      
            this.pushLog(data.id, data.timeIn, data.formattedAddress);
      
          }
        });
      }else{
        if(this.logEntrySubscription != undefined) this.logEntrySubscription.unsubscribe();
      }
    });
    

    

    
  }

  findUnixMax() {
    return new Promise((resolve, reject) => {
      let unixMax = this.time_in_list.reduce((a, b) => {
        return Math.max(a, b);
      });
      if (unixMax) resolve(unixMax);
    });
  }

  getCustomLogs(month) {
    // get existing logs
    this.database.db.executeSql('select * from log where month = ' + month + ' order by logId DESC', {}).then((data) => {
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
          this.database.db.executeSql('select timeIn, formattedAddress, isSeen from log order by timeIn DESC', {}).then((data) => {
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
            // console.log("found new log from remote");
            this.database.db.executeSql('insert into log(logId, timeIn, month, lat, long, formattedAddress, batteryStatus, isSeen, pic) VALUES("' + log._id + '", ' + log.timeIn + ', ' + month + ', ' + log.map.lat + ', ' + log.map.lng + ', "' + log.map.formattedAddress + '", ' + log.batteryStatus + ', ' + isSeen + ', "' + log.pic.original + '")', {}).then(() => {
              // console.log(log._id + " added to local");
            }).catch(e => {
              console.log(e);
            });
          } else {
            // console.log("existing log");
            for (let i = 0; i < data.rows.length; i++) {
              // console.log("checking for update");
              if (data.rows.item(i).isSeen != isSeen || data.rows.item(i).logId != log._id) {
                // console.log("update found. updating local log.");
                this.database.db.executeSql('update log set logId = "' + log._id + '", isSeen = ' + isSeen + ' where timeIn = ' + log.timeIn, {}).then((res) => {
                  // console.log(res + " updated");
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
      this.database.db.executeSql('select * from log where timeIn > ' + maxUnix, {}).then((data) => {
        this.exportMax = data.rows.length;
        if (data.rows.length > 0) {
          console.log("exportMax > 0");
          for (let i = 0; i < data.rows.length; i++) {
            console.log("sending local log to server");
            console.log("converting png to base64");
            this.blobToB64(data.rows.item(i).pic).then((b64) => {
              console.log("image converted to b64; now uploading to server.");

              //send log to server
              this.socketService.socket.emit('cl-timeIn', {
                employeeId: this.employeeService.currentId,
                timeIn: data.rows.item(i).timeIn,
                pic: b64,
                map: {
                  lng: data.rows.item(i).long,
                  lat: data.rows.item(i).lat
                },
                batteryStatus: data.rows.item(i).batteryStatus
              });

            }).catch(e => {
              console.log(e);
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

  blobToB64(url) {
    return new Promise((resolve, reject) => {
      this.base64.encodeFile(url).then((b64File: string) => {
        let b = b64File.split(';');
        let b64 = 'data:image/png;base64,' + b[2].split(",")[1];
        resolve(b64);
      }).catch(e => {
        reject(e);
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
}
