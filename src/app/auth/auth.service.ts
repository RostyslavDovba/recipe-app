import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';

import { User } from './user.model';

export interface AuthResponeData {
  kind?: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root'
 })
export class AuthService {
  user = new Subject<User>();

  constructor(private http: HttpClient) {}

  signup(email: string, password: string) {
    return this.http.post<AuthResponeData>(
      'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBo8Rzrwq_5foeD6yj01AcLVyvkahemwOA',
      {
        email: email,
        password: password,
        returnSecureToken: true
      }
    )
    .pipe(catchError(this.handleError),
      tap(resData => {
        this.handleAuthentiocation(
          resData.email,
          resData.localId,
          resData.idToken,
          +resData.expiresIn
        );
      })
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponeData>(
      'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBo8Rzrwq_5foeD6yj01AcLVyvkahemwOA',
      {
        email: email,
        password: password,
        returnSecureToken: true
      }
    )
      .pipe(catchError(this.handleError),
        tap(resData => {
          this.handleAuthentiocation(
            resData.email,
            resData.localId,
            resData.idToken,
            +resData.expiresIn);
        })
      );
  }

  private handleAuthentiocation(email: string, token: string, userId: string, expiresIn: number ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(
      email,
      userId,
      token,
      expirationDate);
    this.user.next(user);
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'An unknown error occured';
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(errorMessage);
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email does not exist.';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'This password is not correct.';
        break;
    }
    return throwError(errorMessage);
  }
}
