import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ErrorHandler, NgModule, ElementRef } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Camera } from '@ionic-native/camera';
import { Geolocation } from '@ionic-native/geolocation';
import { NativeGeocoder, NativeGeocoderReverseResult } from '@ionic-native/native-geocoder';
import { BatteryStatus } from '@ionic-native/battery-status';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker
 } from '@ionic-native/google-maps';
import { Network } from '@ionic-native/network';
import { Device } from '@ionic-native/device';
import { File } from '@ionic-native/file';
import { Base64 } from '@ionic-native/base64';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { OneSignal } from '@ionic-native/onesignal';
import { LocalNotifications } from '@ionic-native/local-notifications';

import { MyApp } from './app.component';
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';

import { EmployeesProvider } from './../providers/employees/employees';
import { ConnectionProvider } from '../providers/connection/connection';
import { LogProvider } from '../providers/log/log';
import { TimeProvider } from '../providers/time/time';
import { LocationProvider } from '../providers/location/location';
import { DatabaseProvider } from '../providers/database/database';
import { BatteryProvider } from '../providers/battery/battery';
import { DeviceProvider } from '../providers/device/device';
import { StatusProvider } from '../providers/status/status';
import { MessageProvider } from '../providers/message/message';

const config: SocketIoConfig = { url: 'https://socket-io-use.herokuapp.com/', options: {} };
// const config: SocketIoConfig = { url: 'http://192.168.1.73:8080', options: {} };
// const config: SocketIoConfig = { url: 'http://192.168.1.75:8080', options: {} };
@NgModule({
  declarations: [
    MyApp
    ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
    SocketIoModule.forRoot(config)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp
    ],
  providers: [
    StatusBar,
    SplashScreen,
    Camera,
    Geolocation,
    NativeGeocoder,
    BatteryStatus,
    SQLite,
    GoogleMaps,
    Network,
    Device,
    EmployeesProvider,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    ConnectionProvider,
    LogProvider,
    TimeProvider,
    LocationProvider,
    DatabaseProvider,
    BatteryProvider,
    DeviceProvider,
    StatusProvider,
    MessageProvider,
    File,
    Base64,
    BarcodeScanner,
    OneSignal,
    LocalNotifications
  ]
})
export class AppModule {}
