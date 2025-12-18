import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'authenticate', component: HomeComponent },
    { path: 'recommendations', component: HomeComponent },
    { path: 'shop', component: HomeComponent },
    { path: 'award-winners', component: HomeComponent }, // Reuse Home as Stub/Shop
    { path: 'product/:id', component: HomeComponent }, // Stub route for product details
    { path: 'trending', component: HomeComponent },
    { path: 'new-arrivals', component: HomeComponent },
    { path: 'report-counterfeit', component: HomeComponent },
    // Auth routes are imported via AuthModule
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
