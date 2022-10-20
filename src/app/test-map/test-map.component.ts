import {Component, OnInit, ViewChild} from '@angular/core';
import {OrderService} from "../order.service";
import {Geom, Order} from "../order";
import {debounceTime, interval, Subject, Subscription} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {getRiderIconBike} from "../riderIcon";
import {environment} from '../../environments/environment';
import * as HereFlexible from '../here-flexible-polyline';
import Polyline = google.maps.Polyline;
import LatLngLiteral = google.maps.LatLngLiteral;

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
    coordinates: LatLngLiteral[] = [];
    markers: any = [];
    order: Order = {} as Order;
    marker: any = [];
    subscribe: Subscription = new Subscription();
    riderPolyLine = new Polyline();
    pathPolyLine = new Polyline();
    riderMovementPath: LatLngLiteral[] = [];
    movementSubject: Subject<string> = new Subject();

    riderSpeed = 5;

    constructor(public orderService: OrderService, private http: HttpClient) {
    }

    async ngOnInit() {
        await this.orderService.init().then();
        this.order = this.orderService.order;
        this.mapReady();
        this.movementSubject.pipe(
            debounceTime(this.riderSpeed)
        ).subscribe((a?: any) => {
            this.moveRider();
        });
    }

    mapReady() {
        this.riderPolyLine = new Polyline();
        this.pathPolyLine = new Polyline();
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
            scaleControl: false,
            draggable: true,
            disableDoubleClickZoom: true,
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
                content: "Domino's store"
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
        this.orderService.riderPosition.subscribe(res => {
            const bounds = new google.maps.LatLngBounds(res);
            this.map.fitBounds(bounds);
            this.map.setZoom(15);
        })

        const handlePollingPosition = async (lat: number, lng: number) => {
            let oldLat = this.riderLatLng.lat;
            let oldLng = this.riderLatLng.lng;

            if (this.riderMovementPath.length) {
                const latLng = this.riderMovementPath[this.riderMovementPath.length - 1 ];
                oldLat = latLng.lat;
                oldLng = latLng.lng;
            }

            const coords = await this.calculateRiderMovementPath({
                latitude: oldLat,
                longitude: oldLng
            }, {
                latitude: lat,
                longitude: lng
            });
            this.riderMovementPath.push(...coords);
            this.movementSubject.next('true');
        }

        this.map.setCenter(new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude));
        handlePollingPosition(this.order.rider_position.latitude, this.order.rider_position.longitude).then();
        this.subscribe = interval(3000)
            .subscribe(async () => {
                if (!document.hasFocus()) {
                    console.log('Browser tab is changed; skipping polling');
                    return;
                }
                this.orderService.init().then();
                this.order = this.orderService.order;
                if (this.riderLatLng.lat !== this.order.rider_position.latitude || this.riderLatLng.lng !== this.order.rider_position.longitude) {
                    handlePollingPosition(this.order.rider_position.latitude, this.order.rider_position.longitude).then();
                }

            });
        if (this.order.status_name === 'delivered' || this.order.status_name === 'cancelled') {
            this.subscribe.unsubscribe()
        }

    }

    moveRider() {
        if (!this.riderMovementPath.length) {
            return;
        }
        const latLng = this.riderMovementPath.shift();
        this.riderLatLng = latLng;
        if (latLng)
            this.riderPolyLine.getPath().push(new google.maps.LatLng(latLng));
        if (this.riderMovementPath.length) {
            this.movementSubject.next('true');
        }
    }

    generateAnimationPath(a:LatLngLiteral, b: LatLngLiteral): LatLngLiteral[] {
        let coords: LatLngLiteral[] = [];
        let metres = Math.round(google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(a),
            new google.maps.LatLng(b)));

        metres *= 10;

        const deltaLat = (b.lat - a.lat)/metres;
        const deltaLng = (b.lng - a.lng)/metres;

        let lat = a.lat;
        let lng = a.lng;

        for (let i = 0; i <= metres; i++) {
            lat += deltaLat;
            lng += deltaLng;
            coords.push({lat, lng});
        }

        return coords;
    }

    async calculateRiderMovementPath(a: Geom, b: Geom): Promise<LatLngLiteral[]> {
        let coords: LatLngLiteral[] = [];
        let lowestDistance = 10000;
        let lowestIndex = 0;
        this.coordinates.forEach((pathCord, index) => {
            const diff = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(b.latitude, b.longitude),
                new google.maps.LatLng(pathCord.lat, pathCord.lng));
            if (diff <= lowestDistance) {
                lowestDistance = diff;
                lowestIndex = index;
            }
        });

        if (lowestDistance < 50) {
            // rider is on plotted path
            const riderMovementCoords = this.coordinates.splice(0, lowestIndex);
            riderMovementCoords.forEach((coordinate) => {
                if (coords.length) {
                    coords.push(...this.generateAnimationPath(coords[coords.length - 1], coordinate));
                } else {
                    // coords.push(...this.generateAnimationPath({lat: a.latitude, lng: a.longitude}, coordinate));
                }
                coords.push(coordinate)
            });
            if (coords.length) {
                coords.shift();
            }
        } else {
            coords = await this.fetchRouteFromHereMaps(a, b);
            this.riderMovementPath = [];
            this.getRiderPathFromHerePathThenCacheLocally(this.order, false).then();
        }
        return coords;
    }

    async getRiderPathFromHerePathThenCacheLocally(order: any, initial= true) {
        let origin: Geom | undefined = undefined, destination: Geom | undefined = undefined;
        if (order.rider_position && order.rider_position.latitude && order.rider_position.longitude) {
            origin = {latitude: order.rider_position.latitude, longitude: order.rider_position.longitude};
        }
        if (order.delivery_location &&
            order.delivery_location.latitude &&
            order.delivery_location.longitude) {
            destination = {latitude: order.delivery_location.latitude, longitude: order.delivery_location.longitude};
        }
        if (!origin || !destination) {
            return;
        }
        this.coordinates = await this.fetchRouteFromHereMaps(origin, destination);
        try {
            this.pathPolyLine.setMap(null);
        } catch (e) {
            console.log(e);
        }
        this.pathPolyLine = new google.maps.Polyline({
            strokeColor: '#0047b3',
            map: this.map,
            path: this.coordinates, geodesic: true, visible: true,
        });
        if (initial) {
            this.riderPolyLine = new google.maps.Polyline({
                strokeColor: '#0078AC',
                strokeOpacity: 0,
                map: this.map,
                path: [{lat: origin.latitude + 0.0000001, lng: origin.longitude + 0.00000001}],
                icons: getRiderIconBike(),
                zIndex: 100000,
            });
            const zoomToObject = (obj: { getPath: () => { (): any; new(): any; getArray: { (): any; new(): any; }; }; }) => {
                const bounds = new google.maps.LatLngBounds();
                const points = obj.getPath().getArray();
                for (let n = 0; n < points.length; n++) {
                    bounds.extend(points[n]);
                }
                this.map.fitBounds(bounds);
            };
            zoomToObject(this.pathPolyLine as any);
        }

    }


    async fetchRouteFromHereMaps(a: Geom, b: Geom): Promise<LatLngLiteral[]> {
        try {
            const response: HereResponse = (await this.http.get(
                'https://router.hereapi.com/v8/routes', {
                    params: {
                        origin: `${a.latitude},${a.longitude}`,
                        transportMode: 'car',
                        destination: `${b.latitude},${b.longitude}`,
                        'return': 'polyline',
                        apikey: environment.hereApiKey
                    },
                }).toPromise()) as HereResponse;
            const latLngList = HereFlexible.decode(response.routes[0].sections[0].polyline).polyline;
            return latLngList.map((x: any) => {
                return {lat: x[0], lng: x[1]}
            })
        } catch (e) {
            console.error(e);
            return [];
        }
    }
}

export interface HereResponse {
    routes: HereResponseRoute[];
}

export interface HereResponseRoute {
    id: string;
    sections: HereResponseRouteSection[],
}

export interface HereResponseRouteSection {
    id: string;
    type: string;
    departure: any;
    arrival: any;
    polyline: string;
    transport: {
        mode: string;
    };
}
