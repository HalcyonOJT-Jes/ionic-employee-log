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
  photos: any;
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

        // db.executeSql('drop table user', {}).then(() => {
        //   console.log("Dropped table : user");
        // }).catch(e => {
        //   console.log(e);
        // });

        // db.executeSql('drop table log_images', {}).then(() => {
        //   console.log("Dropped table : log_images");
        // }).catch(e => {
        //   console.log(e);
        // });
        /* log table creation */
        /*
          log
          *-id
          --logId
          --userId
          --timeIn
          --month
          --lat
          --long
          --formattedAddress
          --batteryStatus
          --isSeen
          --pic
          --scanResult
        */

        db.executeSql('create table if not exists log(id INTEGER PRIMARY KEY AUTOINCREMENT, logId varchar(255), userId INTEGER, timeIn INTEGER, month INTEGER, lat double, long double, formattedAddress varchar(255), batteryStatus INTEGER, isSeen INTEGER, pic INTEGER, scanResult varchar(255), FOREIGN KEY(userId) REFERENCES user(id))', {}).then(() => {
          console.log('Created log table')
        }).catch(e => {
          console.log(e);
        });

        /* message table creation */
        /*
          message
          *-messageId
          --_id
          --userId
          --time
          --content
          --isMe
          --seenAt
        */
        db.executeSql('create table if not exists message(messageId INTEGER PRIMARY KEY AUTOINCREMENT, _id varchar(255), userId INTEGER, time INTEGER, content varchar(255), isMe INTEGER, seenAt INTEGER, FOREIGN KEY(userId) REFERENCES user(id))', {}).then(() => {
          console.log('Created message table')
        }).catch(e => {
          console.log(e);
        });

        /* log images table creation */
        /**
         * log_images 
         * *-liId
         * **logId -> log(id)
         * --file
         */

        db.executeSql('create table if not exists log_images(liId INTEGER PRIMARY KEY AUTOINCREMENT, logId INTEGER, file varchar(255), FOREIGN KEY(logId) REFERENCES log(id))', {}).then(() => {
          console.log('Created log_images table');
        }).catch(e => {
          console.log(e);
        })

        /* user table creation*/
        /**
         * id
         * userId
         * pic (file path)
         */

        db.executeSql('create table if not exists user(id INTEGER PRIMARY KEY AUTOINCREMENT, userId varchar(255) , pic varchar(255))', {}).then(() => {
          console.log("Created user table.");
        }).catch(e => console.log(e));
        //////////////////////
        //custom sqls 
        
        resolve({ success: true });
      }).catch(e => {
        console.log(e);
        reject(e);
      });
    });
  }

  getLastInsert(table) {
    return new Promise((resolve, reject) => {
      this.db.executeSql('select seq from sqlite_sequence where name = "' + table + '"', {}).then(data => {
        if (data.rows.length > 0) resolve(data.rows.item(0).seq); else resolve(1);
      }).catch(e => console.log(e));
    });
  }

  getUserIntId(userId : string){
    return new Promise((resolve, reject) => {
      this.db.executeSql('select id from user where userId = "'+ userId +'"', {}).then(data => {
        if(data.rows.length > 0) resolve(data.rows.item(0).id); else resolve(-1);
      }).catch(e => console.log(e));
    });
  } 
}
