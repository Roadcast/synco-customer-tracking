import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CustomerTrackingPageComponent} from "./customer-tracking-page/customer-tracking-page.component";

const routes: Routes = [
  {path:'', component:CustomerTrackingPageComponent},
  {path:'tracking_page', component:CustomerTrackingPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
