import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {Order} from "../order";
import {OrderService} from "../order.service";
import {HttpClient} from "@angular/common/http";
import {GeoJSON} from 'leaflet';
import {interval, Subscription} from "rxjs";

@Component({
    selector: 'app-googlemap',
    templateUrl: './googlemap.component.html',
    styleUrls: ['./googlemap.component.css']
})
export class GooglemapComponent implements OnInit {
    @ViewChild('map', {static: false}) mapElement: any;

    options: google.maps.MapOptions = {
        zoomControl: true,
        gestureHandling: 'greedy',
    }
    riderLatLng: any;
    pickupLatLng: any;
    dropLatLng: any;
    map: any;
    coordinates: any = [];
    markers: any = [];
    order: Order = {} as Order;
    orderHereMapRoutePath = {};
    pollOrderSubscription: any;
    marker:any = [];
    sub: Subscription = new Subscription();
    private riderMarker: google.maps.Marker | undefined;
    constructor(public orderService: OrderService, private http: HttpClient) {
    }

    async ngOnInit() {
        await this.orderService.init().then();
        this.order = this.orderService.order;
        this.mapReady();
    }

    mapReady(){
        const mapOptions = {
            center: {
                lat: this.order.delivery_location.latitude,
                lng:  this.order.delivery_location.longitude,
            },
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
        };
        this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
        this.pickupLatLng = {
            lat: this.order.pick_up_location.latitude,
            lng: this.order.pick_up_location.longitude,
        };
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
            lat: this.order.delivery_location.latitude,
            lng: this.order.delivery_location.longitude,
        };
        this.markers.push(this.dropLatLng);
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

        this.getRiderPathFromHerePathThenCacheLocally(this.order).then();

        this.sub = interval(4000)
            .subscribe(() => {

                this.orderService.init().then();
                this.order = this.orderService.order;
                this.riderLatLng = {
                    lat:  this.order.rider_position.latitude,
                    lng:  this.order.rider_position.longitude,
                };
                this.markers.push(this.riderLatLng);

                if (!this.riderMarker) {
                    this.riderMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(this.riderLatLng.lat, this.riderLatLng.lng),
                        icon: {
                            url: 'assets/images/rider_ic.png',
                            scaledSize: new google.maps.Size(40, 40), // size
                        },
                        title: ''
                    });
                    google.maps.event.addListener(this.riderMarker, 'click', () => {
                        const infowindow = new google.maps.InfoWindow({
                            content: this.order.rider.name
                        });
                        infowindow.open(this.map, this.riderMarker);
                    });
                    this.riderMarker.setMap(this.map);
                }
                this.riderMarker.setPosition(new google.maps.LatLng(this.riderLatLng.lat, this.riderLatLng.lng));
                this.map.fitbounds(new google.maps.LatLngBounds(this.riderLatLng,
                    new google.maps.LatLng(this.order.delivery_location.latitude, this.order.delivery_location.longitude)));
            });
        if(this.order.status_name === 'delivered' || this.order.status_name === 'cancelled'){
            this.sub.unsubscribe()
        }
    }

    async getRiderPathFromHerePathThenCacheLocally(order: any) {
        let origin, destination;
        if (order.rider_position &&
            order.rider_position.latitude && order.rider_position.longitude) {

            origin = [ order.rider_position.longitude, order.rider_position.latitude ];
        }
        if (order.delivery_location &&
            order.delivery_location.latitude &&
            order.delivery_location.longitude) {
            destination = [
                order.delivery_location.longitude,
                order.delivery_location.latitude,
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


                const coordsClean = this.coordinates.map((x:any) =>{
                    const dataArray =   x.slice();
                    return {lat: x[1], lng:x[0]}
                });
                new google.maps.Polyline({ strokeColor: 'blue',
                    map: this.map,
                    path: coordsClean, geodesic: true, visible: true,
                });
            });
            this.map.fitbounds(new google.maps.LatLngBounds(
                new google.maps.LatLng(order.rider_position.latitude, order.rider_position.longitude),
                new google.maps.LatLng(order.delivery_location.latitude, order.delivery_location.longitude)));
        }

    }
}







