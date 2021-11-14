/* eslint-disable max-len */
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';
import {
  ActionSheetController,
  AlertController,
  ModalController,
} from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { MapModalComponent } from '../../map-modal/map-modal.component';
import { map, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PlaceLocation, Coordinates } from '../../../places/location.model';
import { of } from 'rxjs';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @Output() locationPick = new EventEmitter<PlaceLocation>();
  @Input() showPreview = false;
  selectedLocationImage: string;
  isLoading = false;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private actionSheetCtrl: ActionSheetController,
    private alterCtrl: AlertController
  ) {}

  ngOnInit() {}

  async onPickLocation() {
    // create action sheet
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Please Choose',
      buttons: [
        {
          text: 'Auto-Locate',
          handler: () => {
            this.autoLocateUser();
          },
        },
        {
          text: 'Pick on Map',
          handler: () => {
            this.openMap();
          },
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });

    // present the action sheet
    await actionSheet.present();
  }

  private async showErrorAlert() {
    const alert = await this.alterCtrl.create({
      header: 'Could not fetch location!',
      message: 'Please use the Pick on Map option.',
      buttons: ['Okay'],
    });
    await alert.present();
  }

  private async autoLocateUser() {
    if (!Capacitor.isPluginAvailable('Geolocation')) {
      // Geolocation feature not available, may be due to the platform not supporting it or permisson denied.
      this.showErrorAlert();
      return;
    }

    // it means Geolocation feature available
    try {
      this.isLoading = true;
      // Gets the current GPS location of the device
      const geoPosition: Position = await Geolocation.getCurrentPosition();
      const coordinates: Coordinates = {
        lat: geoPosition.coords.latitude,
        lng: geoPosition.coords.longitude,
      };
      // create place
      this.createPlace(coordinates.lat, coordinates.lng);
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      this.showErrorAlert();
    }
  }

  private async openMap() {
    // create modal
    const modal = await this.modalCtrl.create({ component: MapModalComponent });
    // present the modal
    await modal.present();
    // on dismiss
    const resultData = await modal.onWillDismiss();
    console.log(resultData);
    if (!resultData.data) {
      return;
    }

    const coordinates: Coordinates = {
      lat: resultData.data.lat,
      lng: resultData.data.lng,
    };
    this.createPlace(coordinates.lat, coordinates.lng);
  }

  private createPlace(lat: number, lng: number) {
    const pickedLocation: PlaceLocation = {
      lat,
      lng,
      address: null,
      staticMapImageUrl: null,
    };

    this.isLoading = true;
    this.getAddress(lat, lng)
      .pipe(
        // take(1), not required because http requests return only once
        switchMap((address) => {
          console.log('Address => ', address);
          pickedLocation.address = address;
          return of(
            this.getMapImage(pickedLocation.lat, pickedLocation.lng, 14)
          );
        }),
        take(1)
      )
      .subscribe(
        (staticMapImageUrl) => {
          pickedLocation.staticMapImageUrl = staticMapImageUrl;
          this.selectedLocationImage = staticMapImageUrl;
          // emit the location data
          this.locationPick.emit(pickedLocation);
          console.log('pickedLocation =>', pickedLocation);
          this.isLoading = false;
        },
        (error) => {
          // in case of errors
          this.isLoading = false;
        }
      );
  }

  // get address from google maps for given coordinates
  private getAddress(lat: number, lng: number) {
    // cors header required by positionstack
    const headers = new HttpHeaders();
    headers.set('Access-Control-Allow-Origin', '*'); // required for positionstack
    headers.set('Access-Control-Allow-Credentials', 'true'); // required for positionstack
    headers.set(
      'Access-Control-Allow-Headers',
      'X-Requested-With,content-type'
    );
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return this.http
      .get<any>(
        `http://api.positionstack.com/v1/reverse?access_key=${environment.positionstackAPIKey}&query=${lat},${lng}`,
        {
          headers,
        }
        //`https://maps.googleapis.com/maps/api/geocode/json?key=&latlng=${lat},${lng}`
      )
      .pipe(
        // For google geocoding API
        /*
        map((geoData) => {
          console.log(geoData);
          if (!geoData || !geoData.results || geoData.results.length <= 0) {
            return null;
          }
          // return first result
          return geoData.results[0].formatted_address;
        })*/

        // For positionstack geocoding API
        map((geoData) => {
          console.log(geoData);
          if (!geoData || !geoData.data || geoData.data.length <= 0) {
            return null;
          }
          // return first result
          return geoData.data[0].label;
        })
      );
  }

  // get map image for given coordinates
  private getMapImage(lat: number, lng: number, zoom: number) {
    return `https://open.mapquestapi.com/staticmap/v4/getmap?key=${environment.mapquestAPIKey}
            &size=500,300&zoom=${zoom}&center=${lat},${lng}`;
  }
}
