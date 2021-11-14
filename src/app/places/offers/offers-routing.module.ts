import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OffersPage } from './offers.page';

const routes: Routes = [
  // hard coded paths must come before dynamic paths
  {
    // path for "/places/tabs/offers"
    path: '',
    component: OffersPage,
  },
  {
    // path for "/places/tabs/offers/new"
    path: 'new',
    loadChildren: () =>
      import('./new-offer/new-offer.module').then((m) => m.NewOfferPageModule),
  },
  {
    // path for "/places/tabs/offers/edit/:placeId"
    path: 'edit/:placeId',
    loadChildren: () =>
      import('./edit-offer/edit-offer.module').then(
        (m) => m.EditOfferPageModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OffersPageRoutingModule {}
