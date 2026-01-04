import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AdminCategoryService } from '../../services/admin-category.service';

export interface Category {
    id: number;
    name: string;
    description?: string;
}

@Component({
    selector: 'app-category-picker-dialog',
    templateUrl: './category-picker-dialog.component.html',
    styleUrls: ['./category-picker-dialog.component.scss']
})
export class CategoryPickerDialogComponent implements OnInit {

    searchControl = new FormControl('');
    categories$!: Observable<Category[]>;
    filteredCategories$!: Observable<Category[]>;

    constructor(
        private dialogRef: MatDialogRef<CategoryPickerDialogComponent>,
        private categoryService: AdminCategoryService
    ) { }

    ngOnInit(): void {
        // Fetch categories
        this.categories$ = this.categoryService.getCategories();

        // Filter logic
        const search$ = this.searchControl.valueChanges.pipe(startWith(''));

        this.filteredCategories$ = combineLatest([this.categories$, search$]).pipe(
            map(([categories, term]) => {
                const searchTerm = (term || '').toLowerCase();
                return categories.filter(c => c.name.toLowerCase().includes(searchTerm));
            })
        );
    }

    selectCategory(category: Category): void {
        this.dialogRef.close(category);
    }

    close(): void {
        this.dialogRef.close();
    }
}
