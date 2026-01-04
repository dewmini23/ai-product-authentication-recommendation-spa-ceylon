import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface CategoryTile {
  name: string;
  slug: string;
  imageUrl: string;
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
      slug: 'skin',
      imageUrl: 'assets/categories/skin-wellness.png'
    },
    {
      name: 'Fragrances',
      slug: 'fragrances',
      imageUrl: 'assets/categories/fragrances.png'
    },
    {
      name: 'Mind & Body',
      slug: 'mind-body',
      imageUrl: 'assets/categories/mind-body.jpg'
    },
    {
      name: 'Hair Wellness',
      slug: 'hair',
      imageUrl: 'assets/categories/hair-wellness.jpg'
    },
    {
      name: 'Home Wellness',
      slug: 'home',
      imageUrl: 'assets/categories/home-wellness.png'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  navigateToCategory(slug: string) {
    this.router.navigate(['/shop'], { queryParams: { category: slug } });
  }
}
