import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { BasicComponent } from './basic/basic.component';
import { CalculatriceComponent } from './basic/calculatrice/calculatrice.component';
import { TvaComponent } from './basic/tva/tva.component';
import { FormsModule } from '@angular/forms';
import { ZzComponent } from './basic/zz/zz.component';
import { XyComponent } from './basic/xy/xy.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ConversionComponent } from './conversion/conversion.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { MyAuthInterceptor } from './common/interceptor/my-auth.interceptor';
import { AdminDeviseComponent } from './admin-devise/admin-devise.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    BasicComponent,
    CalculatriceComponent,
    TvaComponent,
    XyComponent,
    ZzComponent,
    WelcomeComponent,
    ConversionComponent,
    LoginComponent,
    AdminDeviseComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    TabsModule.forRoot()
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MyAuthInterceptor,
      multi: true
      }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
