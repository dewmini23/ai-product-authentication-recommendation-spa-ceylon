import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ProductManagementComponent } from './pages/product-management/product-management.component';

import { AdminProductEditComponent } from './pages/product-create/admin-product-edit.component';
import { AdminProductCreateComponent } from './pages/product-create/admin-product-create.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { RoleGuard } from '../core/guards/role.guard';

const routes: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { role: 'ADMIN' },
        children: [
            { path: 'products', component: ProductManagementComponent },
            { path: 'products/new', component: AdminProductCreateComponent },
            { path: 'products/:id/edit', component: AdminProductEditComponent },
            { path: '', redirectTo: 'products', pathMatch: 'full' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }

