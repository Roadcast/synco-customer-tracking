import {Component, OnInit, ViewChild} from '@angular/core';
import {OrderService} from "../order.service";
import {Order} from "../order";
import {interval, Subscription} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {getRiderIconBike} from "../riderIcon";
import Polyline = google.maps.Polyline;

@Component({
    selector: 'app-test-map',
    templateUrl: './test-map.component.html',
    styleUrls: ['./test-map.component.css']
})
export class TestMapComponent implements OnInit {
    @ViewChild('map', {static: false}) mapElement: any;

    riderLatLng: any;
    pickupLatLng: any;
    dropLatLng: any;
    map: any;
    coordinates: any = [];
    markers: any = [];
    order: Order = {} as Order;
    orderHereMapRoutePath = {};
    marker: any = [];
    subscribe: Subscription = new Subscription();
    oldBearingData: any;
    getData = [];
    bikeSvg: any;
    riderPolyLine: any;
    pathPolyLine: any;
    animationDirectionPathList: google.maps.Polyline[] = [];
    private oldRiderLatLng: any;
    private newPositionsList: any = [];

    constructor(public orderService: OrderService, private http: HttpClient) {
    }

    async ngOnInit() {
        await this.orderService.init().then();
        this.order = this.orderService.order;
        this.mapReady();
    }

    mapReady() {
        this.riderPolyLine = new Polyline()
        this.pathPolyLine = new Polyline()
        this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
            center: {
                lat: this.order.delivery_location.latitude,
                lng: this.order.delivery_location.longitude,
            },
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            scrollwheel: true,
            mapTypeControl: false,
            scaleControl: true,
            draggable: true,
            disableDoubleClickZoom: false,
            zoomControl: false,
            gestureHandling: 'greedy'
        });
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
                scaledSize: new google.maps.Size(48, 48), // size
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
                scaledSize: new google.maps.Size(48, 48), // size
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
        const bounds = new google.maps.LatLngBounds(this.dropLatLng, this.riderLatLng);
        this.map.fitBounds(bounds);
        this.oldRiderLatLng = this.riderLatLng;

        const initialDiff = 10000;
        const delay = 0;
        let i = 0;
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
            const path = this.riderPolyLine.getPath();
            path.push(newLatLng);

            if (i != initialDiff) {
                i++;
                setTimeout(moveMarker, delay);
            }
        }

        this.map.setCenter(new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude));
        this.subscribe = interval(5000)
            .subscribe(() => {
                this.orderService.init().then();
                this.order = this.orderService.order;
                this.riderLatLng = {
                    lat: this.order.rider_position.latitude,
                    lng: this.order.rider_position.longitude,
                };
                this.newPositionsList.push(this.riderLatLng)
                const newLatLng = [this.riderLatLng.lat, this.riderLatLng.lng];
                startAnimationOfMarker(newLatLng)
                this.oldRiderLatLng = this.riderLatLng;
            });
        if (this.order.status_name === 'delivered' || this.order.status_name === 'cancelled') {
            this.subscribe.unsubscribe()
        }

    }

    async getRiderPathFromHerePathThenCacheLocally(order: any) {
        const riderPolyLineColor = '#0078AC';
        const pathPolyLineColor = '#D2112C';
        let origin, destination;
        if (order.rider_position && order.rider_position.latitude && order.rider_position.longitude) {

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
        let coordsClean: any;
        if (origin && destination) {
            const request = this.http.post(
                'https://routing.roadcast.co.in/ors/v2/directions/driving-car/geojson', {
                    coordinates: [
                        origin, destination,
                    ],
                }).subscribe((res: any) => {
                this.coordinates = res.features[0].geometry.coordinates;
                coordsClean = this.coordinates.map((x: any) => {
                    return {lat: x[1], lng: x[0]}
                });
                this.riderPolyLine = new google.maps.Polyline({
                    strokeColor: riderPolyLineColor,
                    map: this.map,
                    icons: getRiderIconBike(),
                    zIndex: 100000
                });

                this.pathPolyLine = new google.maps.Polyline({
                    strokeColor: pathPolyLineColor,
                    map: this.map,
                    path: coordsClean, geodesic: true, visible: true,
                });

                const zoomToObject = (obj: { getPath: () => { (): any; new(): any; getArray: { (): any; new(): any; }; }; }) =>{
                    const bounds = new google.maps.LatLngBounds();
                    const points = obj.getPath().getArray();
                    for (let n = 0; n < points.length ; n++){
                        bounds.extend(points[n]);
                    }
                    this.map.fitBounds(bounds);
                }

                zoomToObject(this.pathPolyLine)

                console.log(coordsClean[0])
                console.log(coordsClean[1])

            });
        }


    }
}
