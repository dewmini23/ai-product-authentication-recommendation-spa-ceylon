# Spa Ceylon - AI Product Authentication & Recommendation Platform

> Angular 15 frontend for the Spa Ceylon product authentication and personalized recommendation system.

## 📋 Quick Start

### Prerequisites
- **Node.js**: v16.x or v18.x ([Download](https://nodejs.org/))
- **npm**: v8.x or higher (comes with Node.js)
- **Angular CLI**: v15.2.0
  ```bash
  npm install -g @angular/cli@15.2.0
  ```
- **Backend API**: The FastAPI backend must be running on `http://127.0.0.1:8000`

### Installation

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install
```

### Running the Application

```bash
# Development server
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any source files.

**Default Port:** 4200  
**Backend API:** http://127.0.0.1:8000

### Production Build

```bash
npm run build
# or
ng build --configuration production
```

Build artifacts will be stored in the `dist/` directory.

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/              # Singleton services, guards, interceptors, models, layout
│   │   │   ├── guards/        # Auth & role guards
│   │   │   ├── interceptors/  # HTTP interceptors (auth token)
│   │   │   ├── services/      # Core services (auth, cart, product)
│   │   │   ├── models/        # TypeScript interfaces
│   │   │   └── components/    # Layout components (navbar, footer)
│   │   ├── auth/              # Auth feature (login, signup)
│   │   ├── admin/             # Admin feature (product management)
│   │   ├── pages/             # Page-level features (home, product-detail)
│   │   │   └── home/
│   │   │       └── components/  # Home-only sections (faq, reviews)
│   │   ├── components/        # Reusable UI components (carousel, masonry)
│   │   ├── app-routing.module.ts
│   │   └── app.module.ts
│   ├── assets/                # Static assets (images, icons)
│   ├── environments/          # Environment configurations
│   └── styles/                # Global styles
├── .gitignore                 # Git ignore rules
├── angular.json               # Angular CLI configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

### Structure Guidelines:
- **`core/`** - Singleton services, guards, interceptors, models, and layout components
- **`auth/`** - Authentication feature module (login, signup)
- **`admin/`** - Admin feature module (product management, lazy-loaded)
- **`pages/`** - Page-level feature modules (home, product-detail)
- **`pages/home/components/`** - Home-specific components (FAQ, reviews sections)
- **`components/`** - Reusable UI components (product carousel, category masonry)

---

## ⚙️ Environment Configuration

### Development Environment
File: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://127.0.0.1:8000'
};
```

### Production Environment
File: `src/environments/environment.prod.ts` (create if needed)

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.spaceylon.com'  // Replace with actual production URL
};
```

**Note:** Update `apiBaseUrl` to match your backend API endpoint.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on http://localhost:4200 |
| `npm run build` | Build for production |
| `npm run watch` | Build in watch mode (development) |
| `npm test` | Run unit tests via Karma |
| `ng generate component <name>` | Generate a new component |
| `ng generate service <name>` | Generate a new service |

---

## ✨ Key Features

### Customer Features
- 🏠 **Home Page**: Browse trending products, new arrivals, award winners
- 🔍 **Product Detail**: View detailed product information, ingredients, certifications
- 🛒 **Shopping Cart**: Add products to cart (localStorage-based)
- 🔐 **Authentication**: Login/signup with JWT-based auth
- 📱 **Responsive Design**: Mobile-first, works on all devices

### Admin Features
- 📊 **Product Management**: CRUD operations for products
- 🏷️ **Category Management**: Assign products to categories
- 🖼️ **Image Upload**: Upload product images
- 🎯 **Flags**: Mark products as trending, new arrival, award winner, festive
- 🔒 **Role-Based Access**: Only ADMIN role can access `/admin` routes

---

## 🔌 API Integration

### Base URL
```
http://127.0.0.1:8000/api
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns JWT token)
- `GET /auth/me` - Get current user profile (requires auth)

#### Products
- `GET /products` - List products (supports filters: trending, new_arrival, award_winner)
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (admin only)
- `PUT /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

### Authentication Flow
1. User logs in via `/login`
2. Backend returns JWT token + user info
3. Token stored in `localStorage` as `access_token`
4. `AuthInterceptor` automatically adds `Authorization: Bearer <token>` to all API requests
5. `AuthGuard` protects routes requiring authentication
6. `RoleGuard` protects admin routes (checks for `ADMIN` role)

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /" or blank page
**Solution:** Ensure backend is running on `http://127.0.0.1:8000`

### Issue: "401 Unauthorized" on API calls
**Solution:** 
1. Check if token exists in localStorage: `localStorage.getItem('access_token')`
2. Verify token is valid (not expired)
3. Re-login to get a fresh token

### Issue: "CORS error"
**Solution:** Backend must allow CORS from `http://localhost:4200`. Check FastAPI CORS middleware.

### Issue: Admin routes accessible without login
**Solution:** Ensure `AuthGuard` and `RoleGuard` are applied to admin routes in `admin-routing.module.ts`

### Issue: Images not loading
**Solution:** 
1. Check `environment.apiBaseUrl` is correct
2. Verify image URLs in database
3. Check backend static file serving

---

## 📄 License

[Specify your license here]

---

**Built with ❤️ using Angular 15**
