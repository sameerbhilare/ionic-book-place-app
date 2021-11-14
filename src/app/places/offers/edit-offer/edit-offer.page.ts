import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';
import {
  NavController,
  LoadingController,
  AlertController,
} from '@ionic/angular';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {
  loadedPlace: Place;
  form: FormGroup;
  placeSub: Subscription;
  isLoading = false;
  placeId: string;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private placesService: PlacesService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    // angular will take care of paramMap unsubscription
    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }

      this.placeId = paramMap.get('placeId');
      this.isLoading = true;
      // this subscrition we need to manage
      this.placeSub = this.placesService
        .getPlace(paramMap.get('placeId'))
        .subscribe(
          (place) => {
            this.loadedPlace = place;
            // initialize form
            this.form = new FormGroup({
              title: new FormControl(this.loadedPlace.title, {
                updateOn: 'blur',
                validators: [Validators.required],
              }),
              description: new FormControl(this.loadedPlace.description, {
                updateOn: 'blur',
                validators: [Validators.required, Validators.maxLength(180)],
              }),
            });
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
                      this.router.navigateByUrl('/places/tabs/offers');
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

  async onEditOffer() {
    if (!this.form.valid) {
      return;
    }
    // define spinner
    const spinnerEl = await this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Updating Place...',
    });
    // show spinner
    await spinnerEl.present();
    // this is one time observable so no need to explicitly clear it. (refer - PlacesService - updatePlace()
    this.placesService
      .updatePlace(
        this.loadedPlace.id,
        this.form.value.title,
        this.form.value.description
      )
      .subscribe(() => {
        // dismiss the spinner
        spinnerEl.dismiss();
        this.form.reset();
        this.router.navigateByUrl('/places/tabs/offers');
      });
  }

  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
}
