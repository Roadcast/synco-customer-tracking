import { Component, OnInit } from '@angular/core';
import {OrderService} from "../order.service";
import {Order} from "../order";

@Component({
  selector: 'app-customer-tracking-page',
  templateUrl: './customer-tracking-page.component.html',
  styleUrls: ['./customer-tracking-page.component.css']
})
export class CustomerTrackingPageComponent implements OnInit {

  order: Order = {} as Order;
  constructor(public  orderService: OrderService) { }

  async ngOnInit(): Promise<void> {
    await this.orderService.init().then();
    this.order = this.orderService.order;
  }
}
