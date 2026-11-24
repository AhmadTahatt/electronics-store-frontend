import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { NotFound } from './pages/not-found/not-found';
import { adminGuard } from './guards/admin-guard';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: '', component: Home, title: 'Galaxy Store' },
  { path: 'login', component: Login, title: 'Log In | Galaxy Store' },
  { path: 'register', component: Register, title: 'Register | Galaxy Store' },

  { path: 'admin-dashboard', component: AdminDashboard, canActivate: [adminGuard], title: 'Admin Dashboard | Galaxy Store' },

  // Pages from the other team members – uncomment as they are added.
  // Every admin route must use canActivate: [adminGuard].
  // { path: 'products', component: Products },
  // { path: 'product/:id', component: ProductDetail },
  // { path: 'compare', component: Compare },
  // { path: 'cart', component: Cart },
  // { path: 'checkout', component: Checkout },
  // { path: 'order-confirmation/:id', component: OrderConfirmation },

  { path: '**', component: NotFound, title: 'Page Not Found | Galaxy Store' }
];
