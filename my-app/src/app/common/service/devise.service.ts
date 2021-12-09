import { Injectable } from '@angular/core';
import { Devise } from '../data/devise';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';


export interface ConvertResult {
  source :string; //ex: "EUR",
  target :string; //ex: "USD",
  amount :number; //ex: 200.0
  result :number; //ex: 217.3913
};

@Injectable({
  providedIn: 'root'
})
export class DeviseService {

  //private _apiBaseUrl ="http://localhost:8282/devise-api"; 

  //ok si ng serve --proxy-config proxy.conf.json
  private _apiBaseUrl ="/devise-api"; 

  constructor(private _http : HttpClient){}

  public getAllDevises$() : Observable<Devise[]>{
    let url = this._apiBaseUrl + "/public/devise" ;
    console.log( "url = " + url);
    return this._http.get<Devise[]>(url);
  }

  public convertir$(montant: number,
                   codeDeviseSrc : string, 
                   codeDeviseTarget : string
                   ) : Observable<number> {
      let url = this._apiBaseUrl + "/public/convert" 
         + `?source=${codeDeviseSrc}`
         + `&target=${codeDeviseTarget}&amount=${montant}` ;
      console.log( "url = " + url);
      return this._http.get<ConvertResult>(url)
                  .pipe(
                      map( (res :ConvertResult) => res.result)
                  );
  }

  public deleteDeviseServerSide$(deviseCode :string):Observable<any>{
    let url = this._apiBaseUrl + "/private/role_admin/devise/" + deviseCode ;
    console.log("deleteUrl=" + url );
    return this._http.delete(url);
  }
}