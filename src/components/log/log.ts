import { LogProvider } from './../../providers/log/log';
import { Component } from '@angular/core';


@Component({
  selector: 'log',
  templateUrl: 'log.html'
})
export class LogComponent {

  constructor(public log : LogProvider) {
    console.log('Hello LogComponent Component');
  }
}