/* eslint-disable arrow-body-style */
/* eslint-disable no-underscore-dangle */
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@capacitor/storage';
import { environment } from '../../environments/environment';
import { BehaviorSubject, from } from 'rxjs';
import { User } from './user.model';
import { map, tap } from 'rxjs/operators';

export interface AuthResponseData {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}
@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  get userIsAuthenticated() {
    // whether user is authenticated.
    // if the token is present and valid then yes
    return this._user
      .asObservable()
      .pipe(map((user) => (user && user.token ? true : false))); // shortcut=> !!user.token
  }

  get userId() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return user.id;
        }
        return null;
      })
    );
  }

  get token() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) {
          return user.token;
        }
        return null;
      })
    );
  }

  constructor(private http: HttpClient) {}

  signup(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(tap(this.setUserData.bind(this))); // this inside of setUserData should refer to AuthService class and not to tap function
  }

  login(email: string, password: string) {
    //this._userIsAuthenticated = true;
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseAPIKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )
      .pipe(tap(this.setUserData.bind(this))); // this inside of setUserData should refer to AuthService class and not to tap function
  }

  // finds Auth data in storage and if it finds it and is valid, then automaticaly logs user in.
  autoLogin() {
    // from operator converts a Promise into an Observable
    return from(Storage.get({ key: 'AuthData' })).pipe(
      map((storedData) => {
        if (!storedData || !storedData.value) {
          return null;
        }

        // convert string to object and typecast
        const parsedAuthData = JSON.parse(storedData.value) as {
          userId: string;
          email: string;
          token: string;
          tokenExpirationDate: string;
        };

        const tokenExpirationDate = new Date(
          parsedAuthData.tokenExpirationDate
        );
        if (tokenExpirationDate <= new Date()) {
          // token expired
          return null;
        }

        // found required auth data, so create User and return
        const user = new User(
          parsedAuthData.userId,
          parsedAuthData.email,
          parsedAuthData.token,
          tokenExpirationDate
        );

        return user;
      }),
      tap((user) => {
        if (user) {
          this._user.next(user);
          // set autologout
          this.autoLogout(user.tokenDuration);
        }
      }),
      // to return true or false
      map((user) => {
        return !!user; // true if we have user else false
      })
    );
  }

  logout() {
    if (this.activeLogoutTimer) {
      // clear existing timer
      clearTimeout(this.activeLogoutTimer);
    }
    // emit user logout
    this._user.next(null);

    // clear storage data (localstorage/device storage)
    //Storage.clear(); // clears all data
    Storage.remove({ key: 'AuthData' }); // clear specific data
  }

  ngOnDestroy() {
    if (this.activeLogoutTimer) {
      // clear existing timer
      clearTimeout(this.activeLogoutTimer);
    }
  }

  // auto logout after the expiration duration is reached
  private autoLogout(duration: number) {
    if (this.activeLogoutTimer) {
      // clear existing timer
      clearTimeout(this.activeLogoutTimer);
    }
    this.activeLogoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  private setUserData(authData: AuthResponseData) {
    // calculate expiration time
    // what we get in 'expiresIn' is 'The number of seconds in which the ID token expires.'
    const expirationTime: Date = new Date(
      new Date().getTime() + +authData.expiresIn * 1000
    );
    const user = new User(
      authData.localId,
      authData.email,
      authData.idToken,
      expirationTime
    );
    // emit user login
    this._user.next(user);
    // set autologout
    this.autoLogout(user.tokenDuration);
    // stora data in localstorate/device storage
    this.storeAuthData(
      authData.localId,
      authData.email,
      authData.idToken,
      expirationTime.toISOString()
    );
  }

  // storing imp data via Capacitor/Storage
  private storeAuthData(
    userId: string,
    email: string,
    token: string,
    tokenExpirationDate: string
  ) {
    const userData = JSON.stringify({
      userId,
      email,
      token,
      tokenExpirationDate,
    });
    // storage needs to string data only
    // for browser/pwa app - it will store in localstorage
    // for native app - it will store in decive storage
    Storage.set({ key: 'AuthData', value: userData });
  }
}
