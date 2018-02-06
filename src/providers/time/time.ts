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
    this.dateTime = this.getDateTime(new Date().getTime());
    this.curUnix = Math.floor(Date.now() / 1000) ;
    this.timeFeed();
  }

  getCurMonth() {
    return new Date().getMonth();
  }

  getDateTime(unix) {
    let date = new Date(unix);
    let d = date.getDate();
    let mth = this.months[date.getMonth()];
    let dy = this.days[date.getDay() - 1];
    let y = date.getFullYear();

    let h = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
    let am_pm = date.getHours() >= 12 ? "pm" : "am";
    let m = "0" + date.getMinutes();
    let s = "0" + date.getSeconds();

    return {
      "time": h + ":" + m.substr(-2) + ":" + s.substr(-2),
      "date": dy + ", " + mth.substring(0, 3) + " " + d + ", " + y,
      "am_pm": am_pm
    }
  }


  timeFeed() {
    setTimeout(() => {
      this.dateTime = this.getDateTime(new Date().getTime());
      this.curUnix = Math.floor(Date.now()) / 1000;
      this.timeFeed();
    }, 1000);
  }
}
