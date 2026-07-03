import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/projects';
  private readonly refreshUrl = 'http://localhost:8080/api/admin/projects/refresh';

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.baseUrl);
  }

  refreshProjects(): Observable<unknown> {
    return this.http.post(this.refreshUrl, {});
  }
}