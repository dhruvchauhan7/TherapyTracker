import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const reqWithAuth = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(reqWithAuth).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isRefreshing && auth.getRefreshToken()) {
        isRefreshing = true;
        return auth.refresh().pipe(
          switchMap(() => {
            isRefreshing = false;
            const t = auth.getAccessToken();
            const retry = t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req;
            return next(retry);
          }),
          catchError(e => { isRefreshing = false; auth.logout(); return throwError(() => e); })
        );
      }
      return throwError(() => err);
    })
  );
};
