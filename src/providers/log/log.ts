import { ConnectionProvider } from './../connection/connection';
import { EmployeesProvider } from './../employees/employees';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TimeProvider } from './../time/time';
import { DatabaseProvider } from '../database/database';
import { Platform } from 'ionic-angular/platform/platform';
import { Base64 } from '@ionic-native/base64';
/*
  Generated class for the LogProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LogProvider {
  local_log = [];
  custom_log = [];
  time_in_list = [];
  unixMax: any;
  constructor(private base64: Base64, private platform: Platform, private connectionService: ConnectionProvider, public http: HttpClient, public timeService: TimeProvider, public database: DatabaseProvider, private socket: Socket, private employeeService: EmployeesProvider) {
    console.log("Hello Log Provider");
    this.socket.on('sv-notifSeen', (logId) => {
      console.log(logId);
      let temp_log = this.local_log;
      // temp_log.find(o => {
      //   if(o._id === logId) o.isSeen = 1;
      //   return true;
      // });
      temp_log.find((o, i) => {
        if(o._id === logId) temp_log[i].isSeen = 1;
        this.local_log = temp_log;
        return true;
      });

    });

    this.database._dbready.subscribe((ready) => {
      // console.log(ready);
      if (ready) {
        // console.log("yes it is ready");
        // console.log(this.connectionService.connection);
        if (this.connectionService.connection) {
          this.socket.emit('cl-getInitNotifEmployee', { employeeId: this.employeeService.currentId });
        } else {
          this.getLocalLogs();
        }
      }
    });

    this.socket.on('sv-sendInitNotif', data => {
      this.getRemoteLogs(data).then((logs) => {
        this.findUnixMax().then((maxUnix) => {
          console.log("max unix received : " + maxUnix);
          this.syncLogs(maxUnix, logs).then(() => {
            console.log("sync complete");
          });
        });
      });
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
    this.database.db.executeSql('select timeIn, formattedAddress, isSeen from log order by timeIn DESC', {}).then((data) => {
      this.local_log = [];
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          console.log(data.rows.item(i).timeIn);
          let dt = this.timeService.getDateTime(data.rows.item(i).timeIn * 1000);

          this.local_log.push({
            time: dt.time + " " + dt.am_pm,
            date: dt.date,
            map: {
              formattedAddress: data.rows.item(i).formattedAddress
            },
            isSeen: data.rows.item(i).isSeen
          });
        }
      }
    }).catch(e => {
      console.log(e);
    });
  }

  getRemoteLogs(data) {
    return new Promise((resolve, reject) => {
      for (let log of data) {
        let dt = this.timeService.getDateTime(log.timeIn * 1000)
        log.time = dt.time + " " + dt.am_pm;
        log.date = dt.date;
        this.local_log.push(log);
        //push to time in list to get the max unix
        this.time_in_list.push(log.timeIn);
        resolve(data);
      }
    });
  }

  syncLogs(maxUnix, remoteLogs) {
    // console.log("syncLogs started");
    return new Promise((resolve, reject) => {
      //IMPORT
      //initialize month and isSeen bool to int conversion
      //check the local log table if current remote log exists
      //NOTE : COULD HAPPEN IF A USER USES A DIFFERENT PHONE
      // console.log("import started");
      // console.log(remoteLogs);
      for (let log of remoteLogs) {
        // console.log(log);
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
        }).catch(e => {
          console.log(e);
        });

      }

      //EXPORT
      //get unsent local logs
      //check connection
      //*convert png image to b64
      //send
      this.database.db.executeSql('select * from log where timeIn > ' + maxUnix, {}).then((data) => {
        if (data.rows.length > 0) {
          for (let i = 0; i < data.rows.length; i++) {
            if (this.connectionService.connection) {
              console.log("sending local log to server");
              console.log("converting png to base64");
              this.blobToB64(data.rows.item(i).pic).then((b64) => {
                console.log("image converted to b64; now uploading to server.");

                //send log to server
                this.socket.emit('cl-timeIn', {
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

          }
        }
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
    this.socket.emit('cl-getInitNotifEmployee', { employeeId: this.employeeService.currentId });
  }

  trackLog(index, log){
    return log ? log.id : undefined;
  }
}
