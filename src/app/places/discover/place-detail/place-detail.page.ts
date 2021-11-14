import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  ModalController,
  NavController,
} from '@ionic/angular';
import { PlacesService } from '../../places.service';
import { Place } from '../../place.model';
import { CreateBookingComponent } from '../../../bookings/create-booking/create-booking.component';
import { Subscription } from 'rxjs';
import { BookingService } from '../../../bookings/booking.service';
import { LoadingController } from '@ionic/angular';
import { AuthService } from '../../../auth/auth.service';
import { MapModalComponent } from '../../../shared/map-modal/map-modal.component';
import { take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  loadedPlace: Place;
  placeSub: Subscription;
  isBookable = false;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private placesService: PlacesService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    // angular will take care of paramMap unsubscription
    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/discover');
        return;
      }

      let fetchedUserId: string;
      this.isLoading = true;
      this.authService.userId
        .pipe(
          take(1),
          switchMap((userId) => {
            if (!userId) {
              throw new Error('No UserId found!');
            }
            fetchedUserId = userId;

            return this.placesService.getPlace(paramMap.get('placeId'));
          }),
          take(1)
        )
        .subscribe(
          (place) => {
            this.loadedPlace = place;
            this.isBookable = place.userId !== fetchedUserId;
            this.isLoading = false;
          },
          (error) => {
            // show alert
            this.alertCtrl
              .create({
                header: 'An Error occurred!',
                message: 'Place could not be fetched. Please try again later!',
                buttons: [
                  {
                    text: 'Okay',
                    handler: () => {
                      this.navCtrl.navigateBack('/places/tabs/discover');
                    },
                  },
                ],
              })
              .then((alertEl) => {
                alertEl.present();
              });
          }
        );
    });
  }

  async onBookPlace() {
    // define action sheet
    // An actionsheet is basically a set of options that slides up from the bottom of the page.
    const actionSheetEl = await this.actionSheetCtrl.create({
      header: 'Choose an Action',
      buttons: [
        {
          text: 'Select Date',
          handler: () => {
            this.openBookModal('select');
          },
        },
        {
          text: 'Random Date',
          handler: () => {
            this.openBookModal('random');
          },
        },
        // role 'destructive' will turn the button red.
        // role 'cancel' will be placed at the last (bottommost)
        { text: 'Cancel', role: 'cancel' },
      ],
    });

    // present the action sheet
    await actionSheetEl.present();

    // this.modalCtrl
    //   .create({
    //     component: CreateBookingComponent,
    //     componentProps: { selectedPlace: this.loadedPlace },
    //   })
    //   .then((modalEl) => {
    //     modalEl.present();
    //   });

    //this.router.navigateByUrl('/places/tabs/discover');

    /*
      NavController - under the hood will use angular router
      but will play proper animation based on forward or backward navigation
    */
    // way 1
    //this.navCtrl.navigateBack('/places/tabs/discover');

    // way 2 - unreliable
    // does not work if stack is empty. So wont work is app starts from this page
    // ADVANTAGE - is we dont have to specify path/URL
    // this.navCtrl.pop();
  }

  async openBookModal(mode: 'select' | 'random') {
    // we can pass any datato model via 'componentProps'
    // create modal
    const modal = await this.modalCtrl.create({
      component: CreateBookingComponent,
      componentProps: { selectedPlace: this.loadedPlace, selectedMode: mode },
    });
    // present modal
    await modal.present();

    // on dismiss
    const resultData = await modal.onWillDismiss();
    console.log(resultData);
    if (resultData.role === 'confirm') {
      // define spinner
      const spinnerEl = await this.loadingCtrl.create({
        keyboardClose: true,
        message: 'Booking Place...',
      });
      // show spinner
      await spinnerEl.present();
      this.bookingService
        .addBooking(
          this.loadedPlace.id,
          this.loadedPlace.title,
          this.loadedPlace.imageUrl,
          resultData.data.bookingData.firstName,
          resultData.data.bookingData.lastName,
          resultData.data.bookingData.guestNumber,
          resultData.data.bookingData.startDate,
          resultData.data.bookingData.endDate
        )
        .subscribe(() => {
          // close spinner
          spinnerEl.dismiss();
          console.log('Booked!');
        });
    }
  }

  async onShowFullMap() {
    // create map modal modal
    const modal = await this.modalCtrl.create({
      component: MapModalComponent,
      // properties passed to the MapModalComponent for customizing map view
      componentProps: {
        center: {
          lat: this.loadedPlace.location.lat,
          lng: this.loadedPlace.location.lng,
        },
        selectable: false,
        closeButtonText: 'Close',
        title: this.loadedPlace.location.address,
      },
    });
    // present modal
    await modal.present();

    // on dismiss
    const resultData = await modal.onWillDismiss();
  }

  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
}
