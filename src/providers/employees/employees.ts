import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the EmployeesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class EmployeesProvider {
  // 5a6554a75192282618345c40
  // 5a61965f2649944a7b8204b4
  employeeIds = ["5a61965f2649944a7b8204b4"];
  currentId = this.employeeIds[Math.floor(Math.random() * this.employeeIds.length)];
  constructor(public http: HttpClient) {
    console.log('Hello EmployeesProvider Provider');
  }

}
