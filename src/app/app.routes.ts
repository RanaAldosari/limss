import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import{Home} from './home/home/home';
import { ForgetPassword } from './auth/forget-password/forget-password';
export const routes: Routes = [
  { path: '', component: Login },    
  { path: 'register', component: Register },
  {path:'home',component:Home},
{ path: 'forget-password', component: ForgetPassword },
  { path: '**', redirectTo: '' }             
];
