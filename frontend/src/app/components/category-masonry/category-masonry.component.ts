import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface CategoryTile {
  name: string;
  slug: string;
}

@Component({
  selector: 'app-category-masonry',
  templateUrl: './category-masonry.component.html',
  styleUrls: ['./category-masonry.component.scss']
})
export class CategoryMasonryComponent implements OnInit {

  categories: CategoryTile[] = [
    {
      name: 'Skin Wellness',
      slug: 'skin'
    },
    {
      name: 'Fragrances',
      slug: 'fragrances'
    },
    {
      name: 'Mind & Body',
      slug: 'mind-body'
    },
    {
      name: 'Hair Wellness',
      slug: 'hair'
    },
    {
      name: 'Home Wellness',
      slug: 'home'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  navigateToCategory(slug: string) {
    this.router.navigate(['/shop'], { queryParams: { category: slug } });
  }
}
