import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MapViewPage } from './map-view';

@NgModule({
  declarations: [
    MapViewPage,
  ],
  imports: [
    IonicPageModule.forChild(MapViewPage),
  ],
})
export class MapViewPageModule {}
