import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the TimeProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class TimeProvider {
  dateTime = {};
  curUnix: number;
  curMonth: any;
  months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  days = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
  ];

  constructor(public http: HttpClient) {
    console.log('Hello TimeProvider Provider');
    this.curUnix = 	Math.round(new Date().getTime()/1000);
    this.timeFeed();
  }

  getCurMonth() {
    return new Date().getMonth();
  }

  timeFeed() {
    setTimeout(() => {
      this.curUnix = 	Math.round(new Date().getTime()/1000);
      this.timeFeed();
    }, 1000);
  }
}
