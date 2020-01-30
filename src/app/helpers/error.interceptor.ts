import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthenticationService } from '@app/services';
import { AlertService } from '../services/alert.service';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(
        private authenticationService: AuthenticationService,
        private alertService: AlertService,
        private router: Router
    ) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401 && request.url.indexOf('/proxy') === -1) {
                // auto logout if 401 response returned from api
                this.authenticationService.logout();

                this.router.navigate([{
                    outlets: { primary: null, system: 'login'}
                }], {
                    queryParams: {
                        returnUrl: this.router.routerState.snapshot.url
                    }
                });
            }

            const error = err.error.message || err.statusText;

            this.alertService.error(error);

            return throwError(error);
        }));
    }
}
