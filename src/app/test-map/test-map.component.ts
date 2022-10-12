import {Component, OnInit, ViewChild} from '@angular/core';
import {OrderService} from "../order.service";
import {Geom, Order} from "../order";
import {interval, Subscription} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {getRiderIconBike} from "../riderIcon";
import Polyline = google.maps.Polyline;
import {environment} from '../../environments/environment';
import * as HereFlexible from '../here-flexible-polyline';

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
        this.orderService.riderPosition.subscribe(res =>{
            const bounds = new google.maps.LatLngBounds(res);
            this.map.fitBounds(bounds);
            this.map.setZoom(15);
        })

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
        };

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
        };

        const handlePollingPosition = (lat: number, lng: number) => {
            this.riderLatLng = {
                lat,
                lng,
            };
            this.newPositionsList.push(this.riderLatLng);
            const newLatLng = [lat, lng];
            startAnimationOfMarker(newLatLng);
            this.oldRiderLatLng = this.riderLatLng;
        }

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        this.map.setCenter(new google.maps.LatLng(this.order.rider_position.latitude, this.order.rider_position.longitude));
        this.subscribe = interval(3000)
            .subscribe(async () => {
                this.orderService.init().then();
                this.order = this.orderService.order;

                let shouldFetchPath = this.checkIfMovedAboveThresholdToFetchPath(this.riderLatLng, this.order.rider_position);

                if (shouldFetchPath) {
                    try {
                        const coords = await this.fetchRouteFromHereMaps(this.riderLatLng, this.order.rider_position);
                        if (coords && coords.length) {
                            const delayMs = Math.round(3000 / coords.length);
                            for (const coordinate of coords) {
                                handlePollingPosition(coordinate[0], coordinate[1]);
                                await sleep(delayMs);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                        shouldFetchPath = false;
                    }
                }

                if (!shouldFetchPath){
                    handlePollingPosition(this.order.rider_position.latitude, this.order.rider_position.longitude);
                }




                // const bounds = new google.maps.LatLngBounds(this.dropLatLng, this.oldRiderLatLng);
                // this.map.fitBounds(bounds);

            });
        if (this.order.status_name === 'delivered' || this.order.status_name === 'cancelled') {
            this.subscribe.unsubscribe()
        }

    }


    async getRiderPathFromHerePathThenCacheLocally(order: any) {
        const riderPolyLineColor = '#0078AC';
        const pathPolyLineColor = '#0047b3';
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
                };

                zoomToObject(this.pathPolyLine);

                console.log(coordsClean[0]);
                console.log(coordsClean[1]);

            });
        }


    }


    checkIfMovedAboveThresholdToFetchPath(a: Geom, b: Geom) {
        try {
            const aLatLng = new google.maps.LatLng(a.latitude, a.longitude);
            const bLatLng = new google.maps.LatLng(b.latitude, b.longitude);
            const newBearing = google.maps.geometry.spherical.computeHeading(aLatLng, bLatLng);

            if (!this.oldBearingData) {
                this.oldBearingData = newBearing; // happens on first polling
            }

            if (newBearing != this.oldBearingData) {
                this.oldBearingData = newBearing;
                return true; // direction Changed
            }

            if (google.maps.geometry.spherical.computeDistanceBetween(aLatLng, bLatLng) > 50) {
                return true; // moved more than 50 metres
            }

        } catch (e) {
            console.error(e);
        }
        return false;

    }


    async fetchRouteFromHereMaps(a: Geom, b: Geom) {
        try {
            const response: HereResponse = (await this.http.get(
                'https://router.hereapi.com/v8/routes', {
                    params: {
                        origin:`${a.latitude},${a.longitude}`,
                        transportMode:'car',
                        destination:`${b.latitude},${b.longitude}`,
                        'return':'polyline',
                        apikey: environment.hereApiKey
                    },
                }).toPromise()) as HereResponse;
            return HereFlexible.decode(response.routes[0].sections[0].polyline).polyline;
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
