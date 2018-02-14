import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
/*
  Generated class for the DatabaseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class DatabaseProvider {
  photos : any;
  public db: any;
  _dbready = new BehaviorSubject<boolean>(false);
  
  constructor(public platform: Platform, public http: HttpClient, private sqlite: SQLite) {
    this.platform.ready().then(() => {
      this.initializeStorage();
    });
  }

  initializeStorage(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.sqlite.create({
        name: 'data.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.db = db;
        this._dbready.next(true);

        // db.executeSql('drop table log', {}).then(() => {
        //   console.log("Dropped table : Log");
        // }).catch(e => {
        //   console.log(e);
        // });

        // db.executeSql('drop table message', {}).then(() => {
        //   console.log("Dropped table : message");
        // }).catch(e => {
        //   console.log(e);
        // });
        /* log table creation */
        /*
          log
          *-id
          --logId
          --timeIn
          --month
          --lat
          --long
          --formattedAddress
          --batteryStatus
          --isSeen
          --pic
        */

        db.executeSql('create table if not exists log(id INTEGER PRIMARY KEY AUTOINCREMENT, logId varchar(255), timeIn INTEGER, month INTEGER, lat double, long double, formattedAddress varchar(255), batteryStatus INTEGER, isSeen INTEGER, pic INTEGER)', {}).then(() => {
          console.log('Created log table')
        }).catch(e => {
          console.log(e);
        });

        /* message table creation */
        /*
          message
          *-messageId
          --time
          --content
          --isMe
        */
        db.executeSql('create table if not exists message(messageId INTEGER PRIMARY KEY AUTOINCREMENT, time INTEGER, content varchar(255), isMe INTEGER)', {}).then(() => {
          console.log('Created message table')
        }).catch(e => {
          console.log(e);
        });
        
        /* log images table creation */
        /**
         * log_images 
         * *-liId
         * **logId -> log(iyd)
         * --file
         */

         db.executeSql('create table if not exists log_images(liId INTEGER PRIMARY KEY AUTOINCREMENT, logId INTEGER, file varchar(255), FOREIGN KEY(logId) REFERENCES log(id))', {}).then(() => {
           console.log('Created log_images table');
         }).catch(e => {
           console.log(e);
         })

        //////////////////////
        //custom sqls 
        resolve({ success: true });
      }).catch(e => {
        console.log(e);
        reject(e);
      });
    });
  }

}
