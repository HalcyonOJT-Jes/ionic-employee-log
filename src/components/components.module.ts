import { NgModule } from '@angular/core';
import { LogComponent } from './log/log';
import { IonicModule } from 'ionic-angular/module';

@NgModule({
	declarations: [LogComponent],
	imports: [IonicModule],
	exports: [LogComponent]
})
export class ComponentsModule {}
