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
  curYear : any;
  yearArr: any;

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
    this.curYear = new Date().getFullYear();
    //2018 kase 2018 ginawa heh
    this.yearArr = Array.from(Array((this.curYear - 2018) + 1), (x, i) => i + 2018).reverse();
    this.curUnix = Math.round(new Date().getTime() / 1000);
    this.timeFeed();
  }

  getCurMonth() {
    return new Date().getMonth();
  }

  timeFeed() {
    setTimeout(() => {
      this.curUnix = Math.round(new Date().getTime() / 1000);
      this.timeFeed();
    }, 1000);
  }
}
