import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { ProductManagementComponent } from './pages/product-management/product-management.component';
import { ProductModalComponent } from './components/product-modal/product-modal.component';
import { AdminProductEditComponent } from './pages/product-create/admin-product-edit.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { AdminProductCreateComponent } from './pages/product-create/admin-product-create.component';
import { CategoryPickerDialogComponent } from './components/category-picker-dialog/category-picker-dialog.component';

@NgModule({
    declarations: [
        AdminLayoutComponent,
        ProductManagementComponent,
        ProductModalComponent,
        AdminProductEditComponent,
        AdminProductCreateComponent,
        CategoryPickerDialogComponent
    ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        // Material
        MatSlideToggleModule,
        MatTabsModule,
        MatCardModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatExpansionModule,
        MatDividerModule,
        ScrollingModule,
        MatDialogModule,
        MatChipsModule,
        OverlayModule
    ]
})
export class AdminModule { }
