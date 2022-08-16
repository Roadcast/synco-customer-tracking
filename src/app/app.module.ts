import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CustomerTrackingPageComponent } from './customer-tracking-page/customer-tracking-page.component';
import { GooglemapComponent } from './googlemap/googlemap.component';
// import {GoogleMapsModule} from "@angular/google-maps";
import { HttpClientModule} from "@angular/common/http";
import { ErrorpageComponent } from './errorpage/errorpage.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgxStarRatingModule} from "ngx-star-rating";
import { TestMapComponent } from './test-map/test-map.component';
import { OrderSummaryComponent } from './order-summary/order-summary.component';

@NgModule({
  declarations: [
    AppComponent,
    CustomerTrackingPageComponent,
    GooglemapComponent,
    ErrorpageComponent,
    TestMapComponent,
    OrderSummaryComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        NgxStarRatingModule,
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
