import { NgModule } from '@angular/core';
import { SafeResourcePipe } from './safe-resource/safe-resource';
@NgModule({
	declarations: [SafeResourcePipe],
	imports: [],
	exports: [SafeResourcePipe]
})
export class PipesModule {
	static forRoot() {
		return {
			ngModule: PipesModule,
			providers: [],
		};
	 }
}
