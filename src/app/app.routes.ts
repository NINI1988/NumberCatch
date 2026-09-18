import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { NumbersComponent } from './numbers.component';
import { CaptureComponent } from './capture.component';
import { MapComponent } from './map.component';
import { FriendsComponent } from './friends.component';
import { ProfileComponent } from './profile.component';
import { authGuard } from './auth.guard';
import { JoinGroupComponent } from './join-group.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'numbers', component: NumbersComponent, canActivate: [authGuard] },
  { path: 'capture', component: CaptureComponent, canActivate: [authGuard] },
  { path: 'map', component: MapComponent, canActivate: [authGuard] },
  { path: 'friends', component: FriendsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'join/:token', component: JoinGroupComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'numbers' },
  { path: '**', redirectTo: 'numbers' },
];
