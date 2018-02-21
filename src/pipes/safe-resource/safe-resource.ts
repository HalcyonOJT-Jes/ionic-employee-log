import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser'
/**
 * Generated class for the SafeResourcePipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'safeResource',
})
export class SafeResourcePipe implements PipeTransform {
  constructor(private sanitizer : DomSanitizer){}

  transform(b64) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(b64);
  }
}
