import { Injectable } from '@angular/core';
import {
  CanLoad,
  Route,
  Router,
  UrlSegment,
  UrlTree,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { take, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanLoad, CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  /*
  Don't use canActivate guard for lazy loaded routes.
  Because that would mean that the code for the lazy loaded module gets downloaded before the guard actually executes
  and that means if we prevent the navigation due to this guard, we unnecessary download the code.
  So instead we should use canLoad which actually is a guard that runs before lazy loaded code is fetched.

  canLoad() will be used to decide whether to load this module. Executes only during module load
  */
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    console.log('AuthGuard - canLoad');
    return this.isAllowed();
  }

  // canActivate() will be used to each time the page is accessed
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    console.log('AuthGuard - canActivate');
    return this.isAllowed();
  }

  private isAllowed() {
    return this.authService.userIsAuthenticated.pipe(
      take(1),
      // check for autologin
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          // try autologin
          return this.authService.autoLogin();
        } else {
          // forward the isAuthenticated info
          return of(isAuthenticated);
        }
      }),
      take(1),
      tap((isAuthenticated) => {
        if (!isAuthenticated) {
          // if user is not authenticated, navigate the user to the Login page
          this.router.navigate(['/auth']);
        }
      })
    );
  }
}
