/* eslint-disable arrow-body-style */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
import { Injectable } from '@angular/core';
import { Booking } from './booking.model';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { delay, take, tap, switchMap, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { stringify } from '@angular/compiler/src/util';

interface BookingData {
  bookFrom: string;
  bookTo: string;
  firstName: string;
  lastName: string;
  guestNumber: number;
  placeId: string;
  placeImage: string;
  placeTitle: string;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private _bookings = new BehaviorSubject<Booking[]>([]);

  constructor(private authService: AuthService, private http: HttpClient) {}

  get bookings() {
    return this._bookings.asObservable();
  }

  addBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    guestNumber: number,
    dateFrom: Date,
    dateTo: Date
  ) {
    let generatedId: string;
    let newBooking: Booking;
    let fetchedUserId: string;
    return this.authService.userId.pipe(
      // take latest snapshot only
      take(1),
      // get userId and create booking and return new observable to POST the booking
      switchMap((userId) => {
        if (!userId) {
          throw new Error('No UserId found!');
        }
        fetchedUserId = userId;

        return this.authService.token;
      }),
      take(1),
      switchMap((token) => {
        newBooking = new Booking(
          Math.random().toString(),
          placeId,
          fetchedUserId,
          placeTitle,
          placeImage,
          firstName,
          lastName,
          guestNumber,
          dateFrom,
          dateTo
        );

        return this.http.post<{ name: string }>(
          `https://ionic-angular-course-6fe16-default-rtdb.asia-southeast1.firebasedatabase.app/bookings.json?auth=${token}`,
          { ...newBooking, id: null }
        );
      }),
      // take(1), not required because http requests return only once
      // get POST response and get generatedId and return new observable of bookings
      switchMap((resData) => {
        generatedId = resData.name;
        return this.bookings; //observable
      }),
      // take(1) => take only one occurence of the event(so latest snapshot) and then cancel the subscription
      take(1),
      tap((bookings) => {
        newBooking.id = generatedId;
        this._bookings.next(bookings.concat(newBooking));
      })
    );
  }

  cancelBooking(bookingId: string) {
    return this.authService.token.pipe(
      take(1),
      switchMap((token) => {
        // delete booking on server
        return this.http.delete(
          `https://ionic-angular-course-6fe16-default-rtdb.asia-southeast1.firebasedatabase.app/bookings/${bookingId}.json?auth=${token}`
        );
      }),
      // take(1), not required because http requests return only once
      switchMap(() => {
        // do nothing with the delete response, just return new observable of local list of bookings
        return this.bookings;
      }),
      // just take one (latest) snapshot
      take(1), // imp
      // remove the booking from local array
      tap((bookingsArr) => {
        this._bookings.next(
          bookingsArr.filter((booking) => booking.id !== bookingId)
        );
      })
    );
  }

  fetchBookings() {
    // fetch bookings for currently logged in user
    let fetchedUserId: string;
    return this.authService.userId.pipe(
      // take latest snapshot only
      take(1),
      // get userId and return new observable to GET the bookings
      switchMap((userId) => {
        if (!userId) {
          throw new Error('No UserId found!');
        }
        fetchedUserId = userId;

        return this.authService.token;
      }),
      take(1),
      switchMap((token) => {
        return this.http.get<{ [key: string]: BookingData }>(
          `https://ionic-angular-course-6fe16-default-rtdb.asia-southeast1.firebasedatabase.app/bookings.json?orderBy="userId"&equalTo="${fetchedUserId}"&auth=${token}`
        );
      }),
      // take(1), not required because http requests return only once
      map((bookingData) => {
        const bookings = [];
        for (const key in bookingData) {
          if (bookingData.hasOwnProperty(key)) {
            bookings.push(
              new Booking(
                key,
                bookingData[key].placeId,
                bookingData[key].userId,
                bookingData[key].placeTitle,
                bookingData[key].placeImage,
                bookingData[key].firstName,
                bookingData[key].lastName,
                bookingData[key].guestNumber,
                new Date(bookingData[key].bookFrom),
                new Date(bookingData[key].bookTo)
              )
            );
          }
        }
        return bookings;
      }),
      tap((bookings) => this._bookings.next(bookings))
    );
  }
}
