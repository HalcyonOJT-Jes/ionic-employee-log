import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { AuthProvider } from '../../providers/auth/auth';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  username: string;
  password: string;

  constructor(public navCtrl: NavController, private loader: LoadingController, private alertController: AlertController, private auth: AuthProvider) {
  }

  login() {
    let loading = this.createLoginLoader();
    loading.present();
    this.auth.authenticate(this.username, this.password).then((data: any) => {
      if (data.success === true) {
        this.auth.storage.set('token', data.token).then(res => {
          this.auth.validateToken(data.token).then(valid => {
            console.log('valid: ', valid);
            if (valid) {
              this.navCtrl.setRoot('HomePage');
              this.auth.token = data.token;
              this.auth.isAuth.next(true);
            }
          });
        }).catch(e => {
          console.log(e);
        });
      } else {
        loading.dismiss();
        loading.onDidDismiss(() => {
          this.alertController.create({
            message: data.msg,
            buttons: ['Ok']
          }).present();
        });
      }
    });
  }

  createLoginLoader() {
    return this.loader.create({
      content: 'Logging in as ' + this.username + '...',
      dismissOnPageChange: true
    });
  }
}
