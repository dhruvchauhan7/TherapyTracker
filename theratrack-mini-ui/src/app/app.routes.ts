import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Clients } from './pages/clients/clients';
import { Shell } from './layout/shell/shell';
import { SessionsPage } from './pages/sessions/sessions.page';
import { PayrollPage } from './pages/payroll/payroll.page';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'clients', component: Clients },
      { path: 'sessions', component: SessionsPage },
      { path: 'payroll', component: PayrollPage },

      // keep placeholders for later:

      { path: 'progress', loadComponent: () => import('./pages/placeholder').then(m => m.Placeholder) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: '' }
];
