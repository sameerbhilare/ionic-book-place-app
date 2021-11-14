import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Place } from '../../places/place.model';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {
  @Input() selectedPlace: Place;
  @Input() selectedMode: 'select' | 'random';
  @ViewChild('form') form: NgForm;

  startDate: string; // string bcz we want to pass it to template(html)
  endDate: string; // string bcz we want to pass it to template(html)

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    const availableFrom = new Date(this.selectedPlace.availableFrom);
    const availableTo = new Date(this.selectedPlace.availableTo);

    // in case of 'select' mode startDate and endDate will be undefined
    if (this.selectedMode === 'random') {
      // random start date between available from and to dates except last 1 week
      this.startDate = new Date(
        availableFrom.getTime() +
          Math.random() *
            (availableTo.getTime() -
              7 * 24 * 60 * 60 * 1000 -
              availableFrom.getTime()) // deducting startTime so that we dont consider from beginning of time which is 1st Jan 1970
      ).toISOString();

      this.endDate = new Date(
        new Date(this.startDate).getTime() +
          Math.random() *
            (new Date(this.startDate).getTime() +
              6 * 24 * 60 * 60 * 1000 - // 6 days starting from startTime not from beginning of time which is 1st Jan 1970
              new Date(this.startDate).getTime())
      ).toISOString();
    }
  }

  onBookPlace() {
    if (!this.form.valid || !this.datesValid()) {
      return;
    }
    // alternatively we can pass id of the modal which you can set while creating a modal
    // and also pass some data
    this.modalCtrl.dismiss(
      {
        bookingData: {
          firstName: this.form.value.firstName,
          lastName: this.form.value.lastName,
          guestNumber: +this.form.value.guestNumber,
          startDate: new Date(this.form.value.dateFrom),
          endDate: new Date(this.form.value.dateTo),
        },
      },
      'confirm'
    );
  }

  datesValid() {
    if (!this.form || !this.form.value.dateFrom || !this.form.value.dateTo) {
      return false;
    }
    const startDate = new Date(this.form.value.dateFrom);
    const endDate = new Date(this.form.value.dateTo);
    return endDate > startDate;
  }

  onCancel() {
    // this will dismiss the nearest modal it finds
    // this.modalCtrl.dismiss();

    // alternatively we can pass id of the modal which you can set while creating a modal
    // and also pass some data
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
