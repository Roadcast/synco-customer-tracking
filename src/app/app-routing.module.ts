import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CustomerTrackingPageComponent} from "./customer-tracking-page/customer-tracking-page.component";
import {ErrorpageComponent} from "./errorpage/errorpage.component";
// import {FeedbackComponent} from "./feedback/feedback.component";

const routes: Routes = [
  {path:'', component:CustomerTrackingPageComponent},
  {path:'tracking_page', component:CustomerTrackingPageComponent},
  {path:'error', component: ErrorpageComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
