import { Component, OnInit } from '@angular/core';
import { Login } from '../common/data/login';
import { LoginService } from '../common/service/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public login : Login = new Login();
  public message :string ="";
  public onLogin(){
     this.message = "donnees saisies = " + JSON.stringify(this.login);
  }

  //injection de dépendance par constructeur
  constructor(private loginService :LoginService) { }

  ngOnInit(): void {
  }

}
