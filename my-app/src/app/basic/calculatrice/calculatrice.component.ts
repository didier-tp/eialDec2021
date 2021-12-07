import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-calculatrice',
  templateUrl: './calculatrice.component.html',
  styleUrls: ['./calculatrice.component.scss']
})
export class CalculatriceComponent implements OnInit {

  public a :number =0 ; //=0 pour initialiser a avec une valeur
                        //par defaut (necessaire en mode strict)
  public b: number =0;

  public res : number =0;

  public onAddition(){
    this.res = this.a + this.b;
  }

  public onMultiplication(){
    this.res = this.a * this.b;
  }

  constructor() { }

  ngOnInit(): void {
  }

}
