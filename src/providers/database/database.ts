import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';

/*
  Generated class for the DatabaseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class DatabaseProvider {
  base64Image : any;
  public db: any;
  constructor(public platform: Platform, public http: HttpClient, private sqlite: SQLite) {
    this.initializeStorage();
  }

  initializeStorage(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.platform.ready().then((src) => {
        this.sqlite.create({
          name: 'data.db',
          location: 'default'
        }).then((db: SQLiteObject) => {
          this.db = db;
          // db.executeSql('drop table log', {}).then(() => {
          //   console.log("Dropped table : Log");
          // }).catch(e => {
          //   console.log(e);
          // });
          /* log table creation */
          /*
            log
            *-logId
            --time
            --month
            --lat
            --long
            --location
            --battery
            --isSeen
          */
          // db.executeSql('create table if not exists log(logId INTEGER PRIMARY KEY AUTOINCREMENT, time INTEGER, month INTEGER, lat double, long double, location varchar(255), battery INTEGER, isSeen INTEGER)', {}).then(() => {
          //   console.log('Created log table')
          // }).catch(e => {
          //   console.log(e);
          // });

          /* message table creation */
          /*
            message
            *-messageId
            --time
            --content
            --isMe
          */
          // db.executeSql('create table if not exists message(messageId INTEGER PRIMARY KEY AUTOINCREMENT, time INTEGER, content varchar(255), isMe INTEGER)', {}).then(() => {
          //   console.log('Created message table')
          // }).catch(e => {
          //   console.log(e);
          // });

          resolve({ success: true });
        }).catch(e => {
          console.log(e);
          reject(e);
        });
      });
    });
  }

}
