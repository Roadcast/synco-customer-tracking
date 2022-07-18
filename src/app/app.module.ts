import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CustomerTrackingPageComponent } from './customer-tracking-page/customer-tracking-page.component';
import { GooglemapComponent } from './googlemap/googlemap.component';
import {GoogleMapsModule} from "@angular/google-maps";
import { HttpClientModule} from "@angular/common/http";
import { ErrorpageComponent } from './errorpage/errorpage.component';

@NgModule({
  declarations: [
    AppComponent,
    CustomerTrackingPageComponent,
    GooglemapComponent,
    ErrorpageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    GoogleMapsModule,
      HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
