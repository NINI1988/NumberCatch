import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { NumbersComponent } from './numbers.component';
import { CaptureComponent } from './capture.component';
import { MapComponent } from './map.component';
import { FriendsComponent } from './friends.component';
import { ProfileComponent } from './profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'numbers', component: NumbersComponent },
  { path: 'capture', component: CaptureComponent },
  { path: 'map', component: MapComponent },
  { path: 'friends', component: FriendsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '', pathMatch: 'full', redirectTo: 'numbers' },
  { path: '**', redirectTo: 'numbers' },
];
