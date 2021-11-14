import { Component, OnDestroy, OnInit } from '@angular/core';
import { Booking } from './booking.model';
import { BookingService } from './booking.service';
import {
  AlertController,
  IonItemSliding,
  LoadingController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {
  loadedBookings: Booking[];
  bookingsSub: Subscription;
  isLoading = false;

  constructor(
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.bookingsSub = this.bookingService.bookings.subscribe((bookings) => {
      this.loadedBookings = bookings;
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.bookingService.fetchBookings().subscribe((bookings) => {
      this.isLoading = false;
    });
  }

  async onCancelBooking(bookingId: string, slidingEl: IonItemSliding) {
    slidingEl.close();
    // define spinner
    const spinnerEl = await this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Cancelling Booking...',
    });
    // show spinner
    await spinnerEl.present();
    this.bookingService.cancelBooking(bookingId).subscribe(
      () => {
        // dismiss the spinner
        spinnerEl.dismiss();
        console.log('Booking cancelled!', bookingId);
      },
      (error) => {
        // dismiss the spinner
        spinnerEl.dismiss();
        console.log('Booking cancellation Failed!', bookingId);
        // show alert
        this.alertCtrl
          .create({
            header: 'An Error occurred!',
            message: 'Booking couldnot be cancelled. Please try again later!',
            buttons: [
              {
                text: 'Okay',
                handler: () => {
                  this.router.navigateByUrl('/bookings');
                },
              },
            ],
          })
          .then((alertEl) => {
            alertEl.present();
          });
      }
    );
  }

  ngOnDestroy() {
    if (this.bookingsSub) {
      this.bookingsSub.unsubscribe();
    }
  }
}
