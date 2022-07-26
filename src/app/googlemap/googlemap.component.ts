import {Component, OnInit, ViewChild} from '@angular/core';
import {Order} from "../order";
import {OrderService} from "../order.service";
import {HttpClient} from "@angular/common/http";
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
    private oldRiderLatLng: any;
    getpoints: any;
    getData = [];
    constructor(public orderService: OrderService, private http: HttpClient) {
    }

    async ngOnInit() {
        await this.orderService.init().then();
        this.order = this.orderService.order;
        // this.mapReady();
        this.dataFirstCall();
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
                url: 'assets/images/store.svg',
                scaledSize: new google.maps.Size(35, 35), // size
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
                url: 'assets/images/home.svg',
                scaledSize: new google.maps.Size(35, 35), // size
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

                if (!this.riderMarker) {
                    this.riderLatLng = {
                        lat:  this.order.rider_position.latitude,
                        lng:  this.order.rider_position.longitude,
                    };
                    this.riderMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude),
                        icon: {
                            url: 'assets/images/bike.svg',
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
                this.oldRiderLatLng = this.riderLatLng;
                this.markers.push(this.riderLatLng);

                this.transition({lat: this.oldRiderLatLng.lat, lng: this.oldRiderLatLng.lng},
                    {lat: this.order.rider_position.latitude, lng: this.order.rider_position.longitude});
                // this.riderMarker.setPosition(new google.maps.LatLng(this.riderLatLng.lat, this.riderLatLng.lng));

                // this.map.fitbounds(new google.maps.LatLngBounds(this.riderLatLng,
                //     new google.maps.LatLng(this.order.delivery_location.latitude, this.order.delivery_location.longitude)));
            });
        if(this.order.status_name === 'delivered' || this.order.status_name === 'cancelled'){
            this.sub.unsubscribe()
        }
    }

    numDeltas = 100;
    delay = 10;
    index = 0;
    markerStore: any;
    transition(oldPosition: { lat: number; lng: number; }, newPosition: { lat: number; lng: number; }) {
        const i = 0;

        const deltaLat = (newPosition.lat - oldPosition.lat) / this.numDeltas;
        const deltaLng = (newPosition.lng - oldPosition.lng) / this.numDeltas;

        this.moveMarker(i, deltaLat, deltaLng);
    }

    moveMarker(i: any, deltaLat: number, deltaLng: number) {
        this.riderLatLng.lat += deltaLat;
        this.riderLatLng.lng += deltaLng;
        const latlng = new google.maps.LatLng(this.riderLatLng.lat, this.riderLatLng.lng);
        // @ts-ignore
        this.riderMarker.setPosition(latlng);
        if (i !== this.numDeltas) {
            setTimeout(() => this.moveMarker(i + 1, deltaLat, deltaLng), this.delay);
        } else {
            this.index++;
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
            // this.map.fitbounds(new google.maps.LatLngBounds(
            //     new google.maps.LatLng(order.rider_position.latitude, order.rider_position.longitude),
            //     new google.maps.LatLng(order.delivery_location.latitude, order.delivery_location.longitude)));
        }

    }
    dataFirstCall() {
        const lat = 24.880667
        const lng = 67.040669
        var self = this;
        const mapOptions = {
            center: {
                lat: lat,
                lng:  lng,
            },
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
        };
        this.drawpoints(mapOptions)
        const SlidingMarker = require('marker-animate-unobtrusive');
        this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
        var marker = new SlidingMarker({
            animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(lat, lng),
            title: lat.toString(),
            map: self.map,
        });
        setTimeout(function () {
            self.drawpoints(
                {
                    "Points": [
                        {
                            "type": "person",
                            "id": 'A',
                            "lat": 24.880749,
                            "lon": 67.041306,

                        },
                    ]

                });

        }, 2000)
        setTimeout(function () {
            self.drawpoints(
                {
                    "Points": [
                        {
                            "type": "person",
                            "id": 'A',
                            "lat": 24.881024,
                            "lon": 67.042035,
                            "data": {
                            }

                        },
                    ]

                });

        }, 3000)
        setTimeout(function () {
            self.drawpoints(
                {
                    "Points": [
                        {
                            "type": "person",
                            "id": 'A',
                            "lat": 24.881520,
                            "lon": 67.043127,
                            "data": {
                            }
                        },
                    ]

                });

        }, 4000)
        setTimeout(function () {
            self.drawpoints(
                {
                    "Points": [
                        {
                            "type": "person",
                            "id": 'A',
                            "lat": 24.881734,
                            "lon": 67.043758,
                            "data": {
                            }
                        },
                    ]

                });

        }, 5000)
        setTimeout(function () {
            self.drawpoints(
                {
                    "Points": [
                        {
                            "type": "person",
                            "id": 'A',
                            "lat": 24.882291,
                            "lon": 67.044930,
                            "data": {
                            }
                        },
                    ]

                });

        }, 6000)
        setTimeout(function () {
            self.drawpoints(
                {
                    "Points": [
                        {
                            "type": "person",
                            "id": 'A',
                            "lat": 24.882496,
                            "lon": 67.045239,
                            "data": {
                            }
                        },
                    ]

                });

        }, 7000)
        setTimeout(function () {
            self.drawpoints(
                {
                    "Points": [
                        {
                            "type": "person",
                            "id": 'A',
                            "lat": 24.882817,
                            "lon": 67.046076,
                            "data": {
                            }
                        },
                    ]

                });

        }, 8000)
        setTimeout(function () {
            self.drawpoints(
                {
                    "Points": [
                        {
                            "type": "person",
                            "id": 'A',
                            "lat": 24.883157,
                            "lon": 67.046548,
                            "data": {
                            }
                        },
                    ]

                });

        }, 90000)
    }
    drawpoints(data:any) {
        let self = this;
        let i = 0;
        var Colors = [
            "#FF0000",
            "#00FF00"
        ];
        for (let key in data.Points){
            let value = data.Points[key];
            console.log('value', value);
            // self.getpoints.push(new google.maps.LatLng(value.lat, value.lon));
            // if (this.markerStore.hasOwnProperty(value.id)) {
            //     var myLatlng = new google.maps.LatLng(value.lat, value.lon);
            //     //pushing previous cordinate of marker
            //     // @ts-ignore
            //     this.markerStore[res.id].previousLatLngs.push(myLatlng);
            //     // @ts-ignore
            //     this.markerStore[res.id].setPosition(myLatlng);
            //     setTimeout(function(){self.map.panTo(myLatlng);},2000);
            //     var lineSymbol = {
            //         path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
            //     };
            //     //create polyline
            //     // @ts-ignore
            //     var flightPath = new google.maps.Polyline({
            //         path: this.markerStore[value.id].previousLatLngs,
            //         geodesic: true,
            //         icons: [{
            //             icon: lineSymbol,
            //             offset: '100%'
            //         }],
            //         strokeColor: Colors[i],
            //         strokeOpacity: 1.0,
            //         strokeWeight: 2
            //     });
            //     setInterval(function(){  flightPath.setMap(self.map);},1000);
            //     i++;
            // }
            // else {
            //     var latlng = new google.maps.LatLng(value.lat, value.lon);
            //     var marker = new SlidingMarker({
            //         animation: google.maps.Animation.DROP,
            //         position: new google.maps.LatLng(value.lat, value.lon),
            //         map: self.map,
            //         // title: "I'm sliding marker",
            //         duration: 1000,
            //         easing: "easeOutQuad"
            //
            //     });
            //     marker.setPosition(latlng);
            //     // @ts-ignore
            //     this.markerStore[res.id] = marker;
            //     // @ts-ignore
            //     this.markerStore[res.id].previousLatLngs = [];
            //     // @ts-ignore
            //     this.markerStore[res.id].previousLatLngs.push(new google.maps.LatLng(res.lat, res.lon));
            //     //
            // }
        }
        // data.Points.forEach( (res: any) => {
        // });
    }
    // changeRadius(event: Event) {
    //     heatmap.set('radius', heatmap.get('radius') ? null : 20);
    // }
}







