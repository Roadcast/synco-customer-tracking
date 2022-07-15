import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'app-googlemap',
  templateUrl: './googlemap.component.html',
  styleUrls: ['./googlemap.component.css']
})
export class GooglemapComponent implements OnInit, AfterViewInit {
  @ViewChild('map', {static: false}) mapElement: any;

  options: google.maps.MapOptions = {
    zoomControl: true,
  }
  center: any;
  map: any;
  markers: any = [];
  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit(){
      navigator.geolocation.getCurrentPosition((position) => {
      this.center = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      this.markers.push(this.center);
         const latLng1 = new google.maps.LatLng(this.center);

         const mapOptions = {
             center: {
                 lat: latLng1.lat(),
                 lng: latLng1.lng()
             },
             zoom: 10,
             mapTypeId: google.maps.MapTypeId.ROADMAP,
             disableDefaultUI: true,
         };
         this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
             const marker = new google.maps.Marker({
                 position: new google.maps.LatLng(this.center.lat, this.center.lng),
                 icon: {
                     url: 'assets/images/location_ic.svg',
                     scaledSize: new google.maps.Size(25, 25), // size
                 },
                 title: ''
             });
             marker.setMap(this.map);
          this.plotPickUpDrop();
     })
  }
    plotPickUpDrop() {

        this.center = {
            lat: 28.66191379076531,
            lng: 77.17281866123926,
        }
        const pickupMarker = new google.maps.Marker({
            position: new google.maps.LatLng(this.center.lat, this.center.lng
            ),
            icon: {
                url: 'assets/images/merchant.png',
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
        this.center = {
            lat: 28.614722300784926,
            lng: 77.20347094552652,
        }
        const dropMarker = new google.maps.Marker({
            position: new google.maps.LatLng(this.center.lat, this.center.lng),
            icon: {
                url: 'assets/images/customer.png',
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
    }
}
