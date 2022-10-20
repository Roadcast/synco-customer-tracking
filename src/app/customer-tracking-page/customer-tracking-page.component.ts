import { Component, OnInit } from '@angular/core';
import {OrderService} from "../order.service";
import {Order} from "../order";
import {Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {interval, Subscription} from "rxjs";
import {getRiderIconFace} from "../riderIcon";
import * as moment from "moment";
import {environment} from "../../environments/environment";


@Component({
  selector: 'app-customer-tracking-page',
  templateUrl: './customer-tracking-page.component.html',
  styleUrls: ['./customer-tracking-page.component.css']
})
export class CustomerTrackingPageComponent implements OnInit {
  getRiderIconFace: any = getRiderIconFace();

  order: Order = {
    id: '',
    rider: {
      name: ''
    },
    delivery_address: {
      google_address: ''
    }} as Order;
  feedbackorder = '';
  feedbackStatus: any;
  rating: any = {
  };
  rating3 = 0;
  public form: FormGroup;
  sub: Subscription | any;
  order_status: any;
  orderStatusDist = {
    50: null,
    200: null,
    300: null,
    400: null,
    500: null,
    600: null,
  };
  orderStatusDate = {
    50: '',
    200: '',
    300: '',
    400: '',
    500: '',
    600: '',
  };
  feedbackPolling = false;
  notes = 'Delivery in';
  orderSummaryValue: boolean = false;
  order_Payment: any;
  body_temp: any;
  firstLocationTime: any;
  updatedTime: any = 0;
  currentUpdateTime: any;
  subTitleTime: any;
  riderNumber: any;
  infoModelValue: boolean = false;
  currentApplicationVersion = environment.appVersion;

  constructor(public orderService: OrderService, private router: Router, private fb: FormBuilder) {
    this.form = this.fb.group({
      rating1: ['', Validators.required],
      rating2: [4]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.orderService.init().then();
    this.order = this.orderService.order;
    this.rating = this.orderService.rating;
    this.order_status = this.orderService.order_status;
    this.order_Payment = this.orderService.orderPayment;
    const bodytemp = this.orderService.body_temp;
    this.body_temp = bodytemp.body_temp_vaccination_status?.EmployeeBodyTemp
    this.order_status.forEach((row: any) => {
      // @ts-ignore
      this.orderStatusDist[row.status_code] = row.status_code;
      // @ts-ignore
      this.orderStatusDate[row.status_code] = row.created_on;
    })
    this.pollingData();
    this.numberMasking()
  }

  // deg2rad1(deg: any) {
  //   return deg * (Math.PI / 180)
  // }

  pollingData(){
    this.sub = interval(4000).subscribe(()=>{
      this.orderService.init().then();
      this.order = this.orderService.order;
      this.order_status = this.orderService.order_status;
      this.order_status.forEach((row: any) => {
        // @ts-ignore
        this.orderStatusDist[row.status_code] = row.status_code;
        // @ts-ignore
        this.orderStatusDate[row.status_code] = row.created_on;
      });
      this.getTimeBtwTwoLatLng(this.order);
    });
    if(this.order.status_name === 'delivered' || this.order.status_name === 'cancelled'){
       this.sub.unsubscribe()
    }
  }
  getTimeBtwTwoLatLng(order: any){
    const lat1 = order.rider_position.latitude;
    const lng1 = order.rider_position.longitude;
    const lat2 = order.delivery_location.latitude;
    const lng2 = order.delivery_location.longitude;

    var R = 6371; // Radius of the earth in kilometers
    var dLat = this.deg2rad(lat2 - lat1); // deg2rad below
    var dLon = this.deg2rad(lng2 - lng1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in KM
    // return d;
    const time = d/40;
    this.updatedTime = Number(time*60);
    // console.log('this.update time', this.updatedTime);
    this.subTitleTime = (this.updatedTime).toFixed(0) + ' min';
    this.firstLocationTime = this.order.drop_off_eta/60
    const firstPerValue = 100/ this.firstLocationTime;
    this.currentUpdateTime = ( this.firstLocationTime - this.updatedTime)* firstPerValue;
    // console.log('this.current update time', this.currentUpdateTime);
    // console.log('thiis. first location time', this.firstLocationTime);
  }

  deg2rad(deg: any) {
    return deg * (Math.PI / 180)
  }


  feedback() {
    const api_url = environment.apiUrl;
    fetch(api_url + 'order/order_feedback/' + `${this.order.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stars: this.rating3,
        feedback: this.feedbackorder,
        customer_id:this.order.customer_id,
        rider_id: this.order.rider_id,
      })
    }).then(async( res) => {
     const resData =  await res.json();
      this.feedbackStatus = resData.status;
      await this.orderService.init();
      this.order = this.orderService.order;
      this.rating = this.orderService.rating;
    })
  }
  numberMasking(){
    const date = this.order.created_on;
    console.log('date ', moment(date).format('YYYY-MM-DD'));
    const api_url = environment.apiUrl;
    fetch(api_url + 'order/virtual_number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_number: this.order.external_id,
        order_date: moment(date).format('YYYY-MM-DD'),
        location_code: "DPI66683",
        employee_code: this.order.rider_id,
      })
    }).then(async( res) => {
       const riderData  =  await res.json();
       this.riderNumber = riderData.virtualNumber;
      // console.log('vvvvvvvvvvvvvvvvvv', this.riderNumber)
    });
  }

  orderSummary() {
    this.orderSummaryValue = true;
  }

  orderSummaryValueClose() {
    this.orderSummaryValue = false;
  }

  getRating(event: any, value: any) {
    this.rating3 = value;
  }

  riderPan() {
    this.orderService.riderPosition.next({lat:this.order.rider_position.latitude,
      lng: this.order.rider_position.longitude});
  }

  infoModel() {
    this.infoModelValue = true;
  }

  infoModelClose() {
    this.infoModelValue = false;
  }
}
