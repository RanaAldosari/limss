import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import{Home} from './home/home/home';
import { ForgetPassword } from './auth/forget-password/forget-password';
import { Reports } from './pages/reports/reports';
import { Samples } from './pages/samples/samples';
import { Staff } from './pages/staff/staff';
import { Templates } from './pages/templates/templates';
import { Tests } from './pages/tests/tests';
import { Configurations } from './pages/configurations/configurations';
import { Location } from './pages/location/location';
import { NewTemplate } from './pages/new-template/new-template';
export const routes: Routes = [
  { path: '', component: Login },    
  { path: 'register', component: Register },
  { path: 'forget-password', component: ForgetPassword },
  {
    path: 'home',
    component: Home,
    children: [
      { path: 'samples', component: Samples },
      { path: 'staff', component: Staff },
      { path: 'reports', component: Reports },
      { path: 'configurations', component: Configurations },
      { path: 'templates', component: Templates },
      { path: 'tests', component: Tests },
      { path: 'location', component: Location },
       { path: 'new-template', component: NewTemplate },
      { path: '', redirectTo: 'samples', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];

