import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthModule } from './auth/auth.module';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';

import { NavbarComponent } from './core/components/navbar/navbar.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductCardComponent } from './pages/home/components/product-card/product-card.component';
import { QuickViewModalComponent } from './pages/home/components/quick-view-modal/quick-view-modal.component';
import { ProductCarouselComponent } from './components/product-carousel/product-carousel.component';
import { CategoryMasonryComponent } from './components/category-masonry/category-masonry.component';
import { ReviewsSectionComponent } from './pages/home/components/reviews-section/reviews-section.component';
import { FaqSectionComponent } from './pages/home/components/faq-section/faq-section.component';

@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        FooterComponent,
        HomeComponent,
        ProductCardComponent,
        QuickViewModalComponent,
        ProductCarouselComponent,
        CategoryMasonryComponent,
        ReviewsSectionComponent,
        FaqSectionComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,
        AuthModule // Eagerly loaded for this prompt requirement, or lazy loaded via router.
        // AuthModule handles its own routing, but if we want '' -> login, we might need to be careful with order.
        // Usually better to lazy load, but for simplicity/prompt requirements "Default route ('') should redirect to /login" can be in AppRoutingModule.
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
