import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryMasonryComponent } from './category-masonry.component';

describe('CategoryMasonryComponent', () => {
  let component: CategoryMasonryComponent;
  let fixture: ComponentFixture<CategoryMasonryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CategoryMasonryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryMasonryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
