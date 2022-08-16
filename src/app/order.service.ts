import {Injectable} from '@angular/core';
import {Router} from "@angular/router";
import {HttpBackend, HttpClient} from "@angular/common/http";
import {log} from "util";

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    order: any;
    rating: any;
    order_status: any;

    constructor(private router: Router, private httpDirect: HttpClient, handler: HttpBackend) {
        this.httpDirect = new HttpClient(handler);

    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const myParam = urlParams.get('order_id');
        if (!myParam) {
            await this.router.navigateByUrl('error');
        }
        const api_url = 'https://jfl-api-dev.roadcast.co.in/api/v1/';
        const response = await fetch(api_url + 'order/order_tracking/' + myParam, {
            method: "GET",
        });
        const data = await response.json()
        this.order = data.data
        this.rating = data.rating
        this.order_status = data.order_status
    }
}
