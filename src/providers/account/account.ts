import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the AccountProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AccountProvider {
  accountId : string;
  accountPic : string;
  constructor(public http: HttpClient) {
    console.log('Hello AccountProvider Provider');
  }

}
