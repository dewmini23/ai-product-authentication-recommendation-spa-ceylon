import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';

const routes: Routes = [
    { path: '', component: HomeComponent, pathMatch: 'full' },
    { path: 'home', component: HomeComponent },  // Added for CUSTOMER role redirect

    // TODO: Create dedicated components for these features
    // These routes currently point to HomeComponent as placeholders
    { path: 'authenticate', component: HomeComponent },  // Placeholder - Future: Product authentication page
    { path: 'recommendations', component: HomeComponent },  // Placeholder - Future: Personalized recommendations
    { path: 'shop', component: HomeComponent },  // Placeholder - Future: Product catalog/shop
    { path: 'award-winners', component: HomeComponent },  // Placeholder - Future: Award winners showcase
    { path: 'trending', component: HomeComponent },  // Placeholder - Future: Trending products
    { path: 'new-arrivals', component: HomeComponent },  // Placeholder - Future: New arrivals showcase
    { path: 'report-counterfeit', component: HomeComponent },  // Placeholder - Future: Counterfeit reporting

    { path: 'products/:id', component: ProductDetailComponent },
    { path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },
    { path: 'admin-dashboard', redirectTo: 'admin', pathMatch: 'full' },  // Added for ADMIN role redirect
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
