import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LogPage } from './log';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    LogPage,
  ],
  imports: [
    IonicPageModule.forChild(LogPage),
    ComponentsModule
  ],
})
export class LogModule {}
