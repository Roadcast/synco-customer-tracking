import { Component, OnInit } from '@angular/core';
import {OrderService} from "../order.service";
import {Order} from "../order";
import {Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {interval} from "rxjs";

@Component({
  selector: 'app-customer-tracking-page',
  templateUrl: './customer-tracking-page.component.html',
  styleUrls: ['./customer-tracking-page.component.css']
})
export class CustomerTrackingPageComponent implements OnInit {

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
  constructor(public  orderService: OrderService, private router: Router, private fb: FormBuilder) {
    this.form = this.fb.group({
      rating1: ['', Validators.required],
      rating2: [4]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.orderService.init().then();
    this.order = this.orderService.order;
    this.rating = this.orderService.rating;

  }
  feedback() {
    const api_url = 'https://jfl-api-dev.roadcast.co.in/api/v1/';
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
     const resData =  await res.json()
      this.feedbackStatus = resData.status
      await this.orderService.init()
      this.order = this.orderService.order;
      this.rating = this.orderService.rating;
    })
  }

  // feedbackClose() {
  //
  // }
}
