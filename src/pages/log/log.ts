import { TimeProvider } from './../../providers/time/time';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { EmployeesProvider } from './../../providers/employees/employees';
import { LogProvider } from '../../providers/log/log';
/**
 * Generated class for the LogPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-log',
  templateUrl: 'log.html',
})
export class LogPage {
  month: any;
  year: any;
  constructor(public navCtrl: NavController, public navParams: NavParams, public employeeId: EmployeesProvider, private log: LogProvider, public timeService: TimeProvider) {
    this.month = '[Select Month]';
    this.year = this.timeService.curYear;
  }

  filterChanged() {
    this.log.getCustomLogs(this.timeService.months.indexOf(this.month), this.year);
  }

  ionViewDidLeave() {
    this.log.custom_log = [];
  }
}
