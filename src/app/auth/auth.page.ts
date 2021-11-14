import { Component, OnInit } from '@angular/core';
import { AuthResponseData, AuthService } from './auth.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  authMode: 'login' | 'signup' = 'login';

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  async authenticate(email: string, password: string) {
    this.isLoading = true;
    // define spinner
    const spinnerEl = await this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Logging in...',
    });
    // show spinner
    await spinnerEl.present();

    let authObs: Observable<AuthResponseData>;
    if (this.authMode === 'login') {
      // send login request
      authObs = this.authService.login(email, password);
    } else {
      // send request to signup service
      authObs = this.authService.signup(email, password);
    }

    // subscribe
    authObs.subscribe(
      (resData) => {
        console.log(resData);
        this.isLoading = false;
        // dismiss the spinner
        spinnerEl.dismiss();
        this.router.navigateByUrl('/places/tabs/discover');
      },
      (errRes) => {
        // dismiss the spinner
        spinnerEl.dismiss();
        console.log(errRes);
        const errCode = errRes.error.error.message;
        let message = 'Could not sign you up, please try again later!';
        if (errCode === 'EMAIL_EXISTS') {
          message = 'This email address already exists!';
        } else if (errCode === 'EMAIL_NOT_FOUND') {
          message = 'Invalid email or password!';
        } else if (errCode === 'INVALID_PASSWORD') {
          message = 'Invalid email or password!';
        }
        this.showAlert(message);
      }
    );
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }

    const email = form.value.email;
    const password = form.value.password;
    this.authenticate(email, password);

    form.reset();
  }

  // toggle auth mode - login or signup
  onSwitchAuthMode() {
    if (this.authMode === 'login') {
      this.authMode = 'signup';
    } else {
      this.authMode = 'login';
    }
  }

  private showAlert(message: string) {
    // show alert
    this.alertCtrl
      .create({
        header: 'Authentication Failed!',
        message,
        buttons: ['Okay'],
      })
      .then((alertEl) => {
        alertEl.present();
      });
  }
}
