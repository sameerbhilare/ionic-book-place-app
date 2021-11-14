import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DiscoverPage } from './discover.page';

const routes: Routes = [
  {
    // path for "/places/tabs/discover"
    path: '',
    component: DiscoverPage,
  },
  {
    // path for "/places/tabs/discover/:placeId
    path: ':placeId',
    loadChildren: () =>
      import('./place-detail/place-detail.module').then(
        (m) => m.PlaceDetailPageModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DiscoverPageRoutingModule {}
