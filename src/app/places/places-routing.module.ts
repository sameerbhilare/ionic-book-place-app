import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlacesPage } from './places.page';

const routes: Routes = [
  {
    // path for "/places/tabs"
    path: 'tabs',
    component: PlacesPage,
    // the component where you have your ion-tabs element needs to have some child routes matching 'tab' attr of ion-tab
    children: [
      {
        // path for "/places/tabs/discover"
        // path matches with 'tab' attr of ion-tab inside places.page.html
        path: 'discover',
        loadChildren: () =>
          import('./discover/discover.module').then(
            (m) => m.DiscoverPageModule
          ),
      },
      {
        // path for "/places/tabs/offers"
        path: 'offers',
        loadChildren: () =>
          import('./offers/offers.module').then((m) => m.OffersPageModule),
      },
      {
        // path for "/places/tabs"
        path: '',
        redirectTo: '/places/tabs/discover',
        pathMatch: 'full', // so that it should only kick in whenwe use "/places/tabs" exactly
      },
    ],
  },
  {
    // path for "/places"
    path: '',
    redirectTo: '/places/tabs/discover',
    pathMatch: 'full', // so that it should only kick in whenwe use "/places" exactly
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlacesPageRoutingModule {}
