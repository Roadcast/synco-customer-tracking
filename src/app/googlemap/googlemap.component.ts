import {Component, OnInit, ViewChild} from '@angular/core';
import {Order} from "../order";
import {OrderService} from "../order.service";
import {HttpClient} from "@angular/common/http";
import {GeoJSON} from 'leaflet';

@Component({
    selector: 'app-googlemap',
    templateUrl: './googlemap.component.html',
    styleUrls: ['./googlemap.component.css']
})
export class GooglemapComponent implements OnInit {
    @ViewChild('map', {static: false}) mapElement: any;

    options: google.maps.MapOptions = {
        zoomControl: true,
    }
    riderLatLng: any;
    pickupLatLng: any;
    dropLatLng: any;
    map: any;
    coordinates: any = [];
    markers: any = [];
    order: Order = {} as Order;
    orderHereMapRoutePath = {};
    constructor(public orderService: OrderService, private http: HttpClient) {
    }

    async ngOnInit() {
        await  this.orderService.init().then();
        this.order = this.orderService.order;
        this.mapReady()
    }

    mapReady(){
        this.order.rider_position.latitude
        this.riderLatLng = {
            lat:  this.order.rider_position.latitude,
            lng:  this.order.rider_position.longitude,
        }
        this.markers.push(this.riderLatLng);
        const latLng1 = new google.maps.LatLng(this.riderLatLng);
        const mapOptions = {
            center: {
                lat: latLng1.lat(),
                lng: latLng1.lng()
            },
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
        };
        this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
        const marker = new google.maps.Marker({
            position: new google.maps.LatLng(this.riderLatLng.lat, this.riderLatLng.lng),
            icon: {
                url: 'assets/images/rider_ic.svg',
                scaledSize: new google.maps.Size(35, 35), // size
            },
            title: ''
        });
        marker.setMap(this.map);
        google.maps.event.addListener(marker, 'click', () => {
            const infowindow = new google.maps.InfoWindow({
                content: this.order.rider.name
            });
            infowindow.open(this.map, marker);
        });
        this.plotPickUpDrop();
    }
    plotPickUpDrop() {
        this.pickupLatLng = {
            lat: this.order.pick_up_location.latitude,
            lng: this.order.pick_up_location.longitude,
        }
        this.markers.push(this.pickupLatLng);
        const pickupMarker = new google.maps.Marker({
            position: new google.maps.LatLng(this.pickupLatLng.lat, this.pickupLatLng.lng
            ),
            icon: {
                url: 'assets/images/merchant.png',
                scaledSize: new google.maps.Size(25, 25), // size
            },
            title: '',
        });
        pickupMarker.setMap(this.map);
        google.maps.event.addListener(pickupMarker, 'click', () => {
            const infowindow = new google.maps.InfoWindow({
                content: 'Pickup'
            });
            infowindow.open(this.map, pickupMarker);
        });
        this.dropLatLng = {
            lat: this.order.merchant_order.delivery_location.latitude,
            lng: this.order.merchant_order.delivery_location.longitude,
        }
        this.markers.push(this.dropLatLng)
        const dropMarker = new google.maps.Marker({
            position: new google.maps.LatLng(this.dropLatLng.lat, this.dropLatLng.lng),
            icon: {
                url: 'assets/images/customer.png',
                scaledSize: new google.maps.Size(25, 25), // size
            },
            title: ''
        });
        dropMarker.setMap(this.map);
        google.maps.event.addListener(dropMarker, 'click', () => {
            const infowindow = new google.maps.InfoWindow({
                content: 'Drop'
            });
            infowindow.open(this.map, dropMarker);
        });

         const bounds = new google.maps.LatLngBounds(this.dropLatLng, this.pickupLatLng);
         this.map.fitBounds(bounds);
         this.getRiderPathFromHerePathThenCacheLocally(this.order).then()
    }



    async getRiderPathFromHerePathThenCacheLocally(order: any) {
        let origin, destination;
        if (order.pick_up_address &&
            order.pick_up_location.latitude && order.pick_up_location.longitude) {
            origin = [ order.pick_up_location.longitude, order.pick_up_location.latitude ];
        }
        if (order.merchant_order.delivery_location &&
            order.merchant_order.delivery_location.latitude &&
            order.merchant_order.delivery_location.longitude) {
            destination = [
                order.merchant_order.delivery_location.longitude,
                order.merchant_order.delivery_location.latitude,
            ];
        }
        if (origin && destination) {
            const request = this.http.post(
                'https://routing.roadcast.co.in/ors/v2/directions/driving-car/geojson', {
                    coordinates: [
                        origin, destination,
                    ],
                }).subscribe((res: any) =>{
                this.coordinates = res.features[0].geometry.coordinates;
                this.showPath(this.coordinates)
            });
        }

    }
    showPath(coordinates: any){
        const coordsClean = coordinates.map((x:any) =>{
          const dataArray =   x.slice()
            return {lat: x[1], lng:x[0]}
        })
        new google.maps.Polyline({ strokeColor: 'blue',
            map: this.map,
            path: coordsClean, geodesic: true, visible: true,
        });
    }
}







