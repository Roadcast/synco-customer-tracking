import {Component, OnInit, ViewChild} from '@angular/core';
import {OrderService} from "../order.service";
import {Order} from "../order";
import {interval, Subscription} from "rxjs";
import {HttpClient} from "@angular/common/http";
import Marker = google.maps.Marker;
import Polyline = google.maps.Polyline;

@Component({
    selector: 'app-test-map',
    templateUrl: './test-map.component.html',
    styleUrls: ['./test-map.component.css']
})
export class TestMapComponent implements OnInit {
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
    marker: any = [];
    subscribe: Subscription = new Subscription();
    private oldRiderLatLng: any;
    oldBearingData: any;
    getpoints: any;
    getData = [];
    bikeSvg: any;
    polyline: any;

    // private newPositionsList: any = [];
    private newPositionsList: any = [];

    constructor(public orderService: OrderService, private http: HttpClient) {
    }

    async ngOnInit() {
        await this.orderService.init().then();
        this.order = this.orderService.order;
        this.mapReady();
        // this.dataFirstCall();
    }

    mapReady() {
        const mapOptions = {
            center: {
                lat: this.order.delivery_location.latitude,
                lng: this.order.delivery_location.longitude,
            },
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
        };

        const newPositions = {
            lat: 0.0,
            lng: 0.0
        }
        this.polyline = new Polyline()
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

        this.riderLatLng = {
            lat: this.order.rider_position.latitude,
            lng: this.order.rider_position.longitude,
        };
        this.oldRiderLatLng = this.riderLatLng;

        const riderIcon = {
            url: 'assets/images/bike.svg',
            scaledSize: new google.maps.Size(40, 40),
        };
        const riderIcon2 = {
            url: 'assets/images/location_ic.svg',
            scaledSize: new google.maps.Size(40, 40),
        };

        const marker2 = new Marker(
            {
                map: this.map,
                icon: riderIcon,
                title: '',
                position: new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude),
                // duration:3000
            });
        //  var bounds = new google.maps.LatLngBounds();

        const initialDiff = 10000;
        const delay = 0;
        var i = 0;
        let diffLat: any;
        let diffLng: any;


        let initialPositionOfMarker = [this.riderLatLng.lat, this.riderLatLng.lng];

        const startAnimationOfMarker = (result: number[]) => {
            i = 0;
            diffLat = (result[0] - initialPositionOfMarker[0]) / initialDiff;
            diffLng = (result[1] - initialPositionOfMarker[1]) / initialDiff;
            moveMarker();

        }

        const moveMarker = () => {
            initialPositionOfMarker[0] += diffLat;
            initialPositionOfMarker[1] += diffLng;
            const newLatLng = new google.maps.LatLng(initialPositionOfMarker[0], initialPositionOfMarker[1]);
            marker2.setPosition(newLatLng);

            if (i != initialDiff) {
                i++;
                setTimeout(moveMarker, delay);
            }
        }

        this.map.panTo(new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude));
        this.subscribe = interval(2000)
            .subscribe(() => {
                this.orderService.init().then();
                this.order = this.orderService.order;

                this.riderLatLng = {
                    lat: this.order.rider_position.latitude,
                    lng: this.order.rider_position.longitude,
                };


                const newPosition = new google.maps.LatLng(this.riderLatLng.lat, this.riderLatLng.lng)
                this.newPositionsList.push(this.riderLatLng)

                const lastPosn = new google.maps.LatLng(this.oldRiderLatLng.lat, this.oldRiderLatLng.lng)
                //this.map.panTo(newPosition);
                // this.map.setCenter(newPosition);
                const bearing = this.getBearing(this.oldRiderLatLng.lat, this.oldRiderLatLng.lng, this.riderLatLng.lat, this.riderLatLng.lng);
                const bearingData = Number(bearing.toFixed(0));
                if (bearingData === 0) {
                    this.bikeSvg = this.oldBearingData - (this.oldBearingData % 15)
                } else {
                    this.bikeSvg = bearingData - (bearingData % 15);
                    this.oldBearingData = bearingData
                }
                if (this.oldBearingData === undefined) {
                    marker2.setIcon({
                        anchor: new google.maps.Point(25, 25),
                        url: 'assets/images/bike.svg',
                        scaledSize: new google.maps.Size(40, 40),
                         rotation: bearing
                    })
                } else {
                    marker2.setIcon({
                        anchor: new google.maps.Point(25, 25),
                        url: 'assets/images/svg/' + this.bikeSvg + '.svg',
                        scaledSize: new google.maps.Size(40, 40),
                        rotation: bearing
                    })
                }
                this.getRiderPathFromHerePathThenCacheLocally(this.order).then();
              //  initialPositionOfMarker = [this.oldRiderLatLng.lat, this.oldRiderLatLng.lng]
                const newLatLng = [this.riderLatLng.lat, this.riderLatLng.lng];
                startAnimationOfMarker(newLatLng)
                this.oldRiderLatLng = this.riderLatLng;
            });
        if (this.order.status_name === 'delivered' || this.order.status_name === 'cancelled') {
            this.subscribe.unsubscribe()
        }
    }


    radians(n: number) {
        return n * (Math.PI / 180);
    }

    degrees(n: number) {
        return n * (180 / Math.PI);
    }

    getBearing(startLat: number, startLong: number, endLat: number, endLong: number) {
        startLat = this.radians(startLat);
        startLong = this.radians(startLong);
        endLat = this.radians(endLat);
        endLong = this.radians(endLong);

        var dLong = endLong - startLong;

        var dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0));
        if (Math.abs(dLong) > Math.PI) {
            if (dLong > 0.0)
                dLong = -(2.0 * Math.PI - dLong);
            else
                dLong = (2.0 * Math.PI + dLong);
        }

        return (this.degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
    }

    async getRiderPathFromHerePathThenCacheLocally(order: any) {
        let origin, destination;
        if (order.rider_position &&
            order.rider_position.latitude && order.rider_position.longitude) {

            origin = [order.rider_position.longitude, order.rider_position.latitude];
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
                }).subscribe((res: any) => {
                this.coordinates = res.features[0].geometry.coordinates;
                const coordsClean = this.coordinates.map((x: any) => {
                    return {lat: x[1], lng: x[0]}
                });
                this.polyline.setMap(null)
                this.polyline = new google.maps.Polyline({
                    strokeColor: 'blue',
                    map: this.map,
                    path: coordsClean, geodesic: true, visible: true,
                });

                // console.log('polylines created')
            });
        }

    }
}
