import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
/*
  Generated class for the SocketProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class SocketProvider {
  public io = io;
  // serverAddress: string = 'http://192.168.0.73:8080';
  serverAddress: string = 'https://socket-io-use.herokuapp.com';
  socket: SocketIOClient.Socket;
  constructor(public http: HttpClient) {
  }

}
