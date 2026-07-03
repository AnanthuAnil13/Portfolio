import { Routes } from '@angular/router';
import { WorkComponent } from './pages/work/work.component';

export const routes: Routes = [
  { path: '', redirectTo: 'work', pathMatch: 'full' },
  { path: 'work', component: WorkComponent }
];