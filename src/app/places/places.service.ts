/* eslint-disable max-len */
/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable no-underscore-dangle */
import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { delay, map, switchMap, take, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PlaceLocation } from './location.model';

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}
@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  // BehaviorSubject is same as Subject but all future subscribers will immediately receive last emitted data (latest data)
  private _places = new BehaviorSubject<Place[]>([]);
  // private _places = new BehaviorSubject<Place[]>([
  //   new Place(
  //     'p1',
  //     'Manhattan Mansion',
  //     'In the heart of New York City.',
  //     'https://lonelyplanetimages.imgix.net/mastheads/GettyImages-538096543_medium.jpg?sharp=10&vib=20&w=1200',
  //     149.99,
  //     new Date('2021-01-01'),
  //     new Date('2021-12-31'),
  //     'xys'
  //   ),
  //   new Place(
  //     'p2',
  //     "L'Amour Toujours",
  //     'A romantic place in Paris!',
  //     'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Paris_Night.jpg/1024px-Paris_Night.jpg',
  //     189.99,
  //     new Date('2021-01-01'),
  //     new Date('2021-12-31'),
  //     'abc'
  //   ),
  //   new Place(
  //     'p3',
  //     'The Foggy Palace',
  //     'Not your average city trip!',
  //     'https://upload.wikimedia.org/wikipedia/commons/0/01/San_Francisco_with_two_bridges_and_the_fog.jpg',
  //     99.99,
  //     new Date('2021-01-01'),
  //     new Date('2021-12-31'),
  //     'abc'
  //   ),
  // ]);

  constructor(private authService: AuthService, private http: HttpClient) {}

  get places() {
    return this._places.asObservable();
  }

  fetchPlaces() {
    return this.authService.token.pipe(
      take(1),
      switchMap((token) => {
        // returns key of any name and value as PlaceData object
        return this.http.get<{ [key: string]: PlaceData }>(
          `https://ionic-angular-course-6fe16-default-rtdb.asia-southeast1.firebasedatabase.app/offerred-places.json?auth=${token}`
        );
      }),
      // take(1), not required because http requests return only once
      // map operator gets responseData and returns restructured data
      map((resData) => {
        console.log(resData);
        // first convert the object to array
        const places = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location
              )
            );
          }
        }
        return places;
        //return []; // for faking case when there is no data
      }),
      tap((places) => {
        // so that all the subscribers will get latest data
        this._places.next(places);
      })
    );
  }

  getPlace(placeId: string) {
    return this.authService.token.pipe(
      take(1),
      switchMap((token) => {
        // returning a clone
        return this.http.get<PlaceData>(
          `https://ionic-angular-course-6fe16-default-rtdb.asia-southeast1.firebasedatabase.app/offerred-places/${placeId}.json?auth=${token}`
        );
      }),
      // take(1), not required because http requests return only once
      map((placeData) => {
        return new Place(
          placeId,
          placeData.title,
          placeData.description,
          placeData.imageUrl,
          placeData.price,
          new Date(placeData.availableFrom),
          new Date(placeData.availableTo),
          placeData.userId,
          placeData.location
        );
      })
    );
    // return this._places.pipe(
    //   take(1),
    //   map((placesArr) => {
    //     return { ...placesArr.find((p) => p.id === placeId) };
    //   })
    // );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    location: PlaceLocation
  ) {
    let generatedId: string;
    let newPlace: Place;
    let fetchedUserId: string;
    return this.authService.userId.pipe(
      // take latest snapshot only
      take(1),
      // get userId, store it and return new observable for token
      switchMap((userId) => {
        if (!userId) {
          throw new Error('No UserId found!');
        }
        fetchedUserId = userId;
        return this.authService.token;
      }),
      // take latest snapshot only
      take(1),
      // get token and create booking and return new observable to POST the booking
      switchMap((token) => {
        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          'https://lonelyplanetimages.imgix.net/mastheads/GettyImages-538096543_medium.jpg?sharp=10&vib=20&w=1200',
          price,
          dateFrom,
          dateTo,
          fetchedUserId,
          location
        );

        return this.http.post<{ name: string }>(
          `https://ionic-angular-course-6fe16-default-rtdb.asia-southeast1.firebasedatabase.app/offerred-places.json?auth=${token}`,
          // copy all properties but set id to null as firebase will set the id while saving
          { ...newPlace, id: null }
        );
      }),
      // take(1), not required because http requests return only once
      // gets data and returns new observation and will replace existing observable in the chain
      switchMap((responseData) => {
        generatedId = responseData.name;
        // returning different observable *********************
        return this.places;
      }),
      // take(1) => take only one occurence of the event(so latest snapshot) and then cancel the subscription
      take(1),
      // tap will allow us to perform some other action from this chain and wont affect the chain
      tap((placesArr) => {
        // using firebase generated id
        newPlace.id = generatedId;
        // .cancat() is default array method which adds an item to the array and returns a new array
        this._places.next(placesArr.concat(newPlace)); // emit the new array
      })
    );
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[] = [];
    let fetchedToken: string;
    return this.authService.token.pipe(
      take(1),
      switchMap((token) => {
        fetchedToken = token;
        return this._places;
      }),
      // only take the latest and dont set active subscription
      take(1),
      // return places (either by fetching or alredy fetched)
      switchMap((places) => {
        if (!places || places.length <= 0) {
          // fetch places if doesn't exist
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      // only take the latest and dont set active subscription
      take(1),
      // here places are guaranteed to be present
      switchMap((places) => {
        // find updated place index
        const updatedPlaceIndex = places.findIndex((p) => p.id === placeId);
        // take copy of existing places
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );

        // return different observable
        // put will replace existing data with new data
        return this.http.put(
          `https://ionic-angular-course-6fe16-default-rtdb.asia-southeast1.firebasedatabase.app/offerred-places/${placeId}.json?auth=${fetchedToken}`,
          { ...updatedPlaces[updatedPlaceIndex], id: null }
        );
      }),
      // take(1), not required because http requests return only once
      tap((resData) => {
        // emit updated places array
        this._places.next(updatedPlaces);
      })
    );
  }
}
