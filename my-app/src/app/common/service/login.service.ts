import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Login } from '../data/login';
import { LoginResponse } from '../data/loginResponse';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private baseUrl="/login-api"; //pas besoin de préciser http://localhost:8282/login-api
  //si proxy.conf.json

  public postLogin$(login: Login): Observable<LoginResponse>{
    let url = this.baseUrl + "/public/auth"
    return this._http.post<LoginResponse>(url,login);
  }

  constructor(private _http : HttpClient) { }
}
