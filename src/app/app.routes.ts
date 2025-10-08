import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import{Home} from './home/home/home';
import { ForgetPassword } from './auth/forget-password/forget-password';
import { Reports } from './pages/reports/reports';
// Update the import to match the actual exported member from './pages/samples/samples'
import { SamplesComponent } from './pages/samples/samples';
import { Staff } from './pages/staff/staff';
import { Templates } from './pages/templates/templates';
import { Tests } from './pages/tests/tests';
import { Configurations } from './pages/configurations/configurations';
import { Location } from './pages/location/location';
import { NewTemplate } from './pages/new-template/new-template';
import { LogSampleComponent } from './pages/log-sample/log-sample';
import { SampleDetailComponent } from './pages/sample-detail/sample-detail';
import { UserActivityComponent } from './pages/reports/user-activity/user-activity';
import { SampleReportsComponent } from './pages/reports/sample-reports/sample-reports';
import { TestReportsComponent } from './pages/reports/test-reports/test-reports';
import { TestMain } from './pages/test-main/test-main';
import { Role } from './pages/role/role';
import { RoleAccessComponent } from './pages/role-access/role-access';
// import { UserActivityComponent } from './pages/reports/user-activity/user-activity';
import { Coordinat } from './pages/coordinat/coordinat';
import { GroupList } from './pages/group-list/group-list';
import { MyTest } from './pages/my-test/my-test';
// import { TestDetail } from './pages/test-list/test-list';
import { MyTestDetailsComponent } from './pages/my-test-details/my-test-details';
import { ResultDetails } from './pages/result-details/result-details';
export const routes: Routes = [
  { path: '', component: Login },    
  { path: 'register', component: Register },
  { path: 'forget-password', component: ForgetPassword },
  {
    path: 'home',
    component: Home,
    children: [
      { path: 'samples', component: SamplesComponent },
         { path: 'samples/new', component: LogSampleComponent },
 { path: 'samples/:id', component: SampleDetailComponent },
      { path: 'staff', component: Staff },
      // { path: 'reports', component: Reports },
      { 
  path: 'reports', 
  component: Reports,
},
//  { path: 'home/my-test/:id', component: MyTestDetailsComponent },
{path:'sample-reports',component:SampleReportsComponent},
{path:'test-reports',component:TestReportsComponent},
{path:'user-activity',component:UserActivityComponent},
{path:'roles',component:Role},
{path:'role-access',component:RoleAccessComponent},
// { path: 'my-test/:id', component: TestDetail },
//  { path: 'my-test/optimistic/:id', component: TestDetail }, // ضعها قبل :id
      // { path: 'my-test/:id', component: TestDetail },
{path:'test-section',component:TestMain},
{path:'my-test' ,component:MyTest},
 // 2. Specific route for optimistic (pending) tests
      // The router expects a parameter named 'oid' based on how MyTestDetailsComponent is implemented (this.route.snapshot.paramMap.get('oid'))
      { path: 'my-test/optimistic/:oid', component: MyTestDetailsComponent }, 
      {path:'result-details/:testId',component:ResultDetails},
      // 3. General route for API-sourced tests
      // This MUST come after the 'optimistic' route
      { path: 'my-test/:id', component: MyTestDetailsComponent },
      { path: 'configurations', component: Configurations },
      { path: 'templates', component: Templates },
      { path: 'tests', component: Tests },
      {path:'group-list',component:GroupList},
      {path:'coordinat',component:Coordinat},
      { path: 'location', component: Location },
       { path: 'new-template', component: NewTemplate },
      { path: '', redirectTo: 'samples', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];

