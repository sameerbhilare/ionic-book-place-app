import { Component, OnDestroy, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { SegmentChangeEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { Place } from '../place.model';
import { PlacesService } from '../places.service';
import { AuthService } from '../../auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  isLoading = false;
  loadedPlaces: Place[] = [];
  relevantPlaces: Place[] = [];
  placesSub: Subscription;
  private filter = 'all';

  constructor(
    private placesService: PlacesService,
    private menuCtrl: MenuController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.placesSub = this.placesService.places.subscribe((places) => {
      this.loadedPlaces = places;
      this.onFilterUpdate(this.filter);
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  onOpenMenu() {
    // programatically toggling menu
    this.menuCtrl.toggle();
  }

  /* CustomEvent is a default web feature.
     It's a generic type, which means you can also pass some extra data
     about which custom event data does custom event object will hold.
  */
  onFilterUpdate(filter: string) {
    this.authService.userId.pipe(take(1)).subscribe((userId) => {
      if (!userId) {
        return;
      }

      const isShown = (place) => filter === 'all' || place.userId !== userId;
      this.relevantPlaces = this.loadedPlaces.filter(isShown);
      this.filter = filter;
    });
  }

  onFilterUpdateUI(event: any) {
    this.onFilterUpdate(event.detail.value);
  }

  ngOnDestroy() {
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }
}
