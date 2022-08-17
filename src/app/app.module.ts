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
import {NgCircleProgressModule} from "ng-circle-progress";

@NgModule({
  declarations: [
    AppComponent,
    CustomerTrackingPageComponent,
    GooglemapComponent,
    ErrorpageComponent,
    TestMapComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        NgxStarRatingModule,
        NgCircleProgressModule.forRoot({
            "radius": 60,
            "space": -10,
            "outerStrokeGradient": true,
            "outerStrokeWidth": 10,
            "outerStrokeColor": "#4882c2",
            "outerStrokeGradientStopColor": "#53a9ff",
            "innerStrokeColor": "#e7e8ea",
            "innerStrokeWidth": 10,
            "title": "UI",
            "animateTitle": false,
            "animationDuration": 1000,
            "showUnits": false,
            "showSubtitle":true,
            "subtitle": "30",
            "subtitleFontSize":"12",
            "showBackground": false,
            "clockwise": true,
            "startFromZero": false,
            "lazy": true})
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
