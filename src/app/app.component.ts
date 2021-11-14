import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private userIsAuthenticatedSub: Subscription;
  private previousAuthState = false;

  constructor(
    private platform: Platform,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if (Capacitor.isPluginAvailable('SpashScreen')) {
        // hide the splashscreeen which automatically loads when the app boots
        // A splash screen is mostly the first screen of the app when it is opened.
        // It is a constant screen which appears for a specific amount of time,
        // generally shows for the first time when the app is launched.
        SplashScreen.hide();
      }
    });
  }

  ngOnInit() {
    this.userIsAuthenticatedSub =
      this.authService.userIsAuthenticated.subscribe((isAuthenticated) => {
        // this.previousAuthState is required bcz this code runs faster AuthGuard code
        if (!isAuthenticated && this.previousAuthState !== isAuthenticated) {
          this.router.navigateByUrl('/auth');
        }
        this.previousAuthState = isAuthenticated;
      });
  }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    if (this.userIsAuthenticatedSub) {
      this.userIsAuthenticatedSub.unsubscribe();
    }
  }
}
