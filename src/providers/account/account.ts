import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DatabaseProvider } from '../database/database';

/*
  Generated class for the AccountProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AccountProvider {
  accountIntId : number;
  accountId : string;
  accountPic : string;
  constructor(
    public http     : HttpClient,
    public database : DatabaseProvider
  ) {
    console.log('Hello AccountProvider Provider');
  }

  accountExists(userId : string){
    return new Promise((resolve, reject) => {
      this.database.db.executeSql('select id, pic, userId from user where userId = "' + userId+ '"', {}).then(data => {
        if(data.rows.length == 1){
          console.log(data.rows.item(0).pic);
          this.accountIntId = data.rows.item(0).id;
          this.accountPic = data.rows.item(0).pic;
          this.accountId = data.rows.item(0).userId;
          resolve(true);
        } else resolve(false);
      }).catch(e => console.log(e));
    });
  }

  saveUser(userId : string, pic : string){
    return new Promise((resolve, reject) => {
      this.database.db.executeSql('insert into user(userId, pic) values("'+ userId +'", "'+ pic +'")', {}).then(() => {
        console.log("User : " + userId + " saved to database.");
        this.database.getLastInsert('user').then((id : number) => {
          this.accountId = userId;
          this.accountPic = pic;
          this.accountIntId = id;
          resolve(true);
        }).catch(e => console.log(e));
      }).catch(e => console.log(e));
    });
  }
  
}
