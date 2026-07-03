import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work.component.html',
  styleUrl: './work.component.css'
})
export class WorkComponent implements OnInit {
  private document = inject(DOCUMENT);
  private projectService = inject(ProjectService);
  private readonly themeStorageKey = 'worktab-theme';

  projects: Project[] = [];
  loading = true;
  refreshing = false;
  error = '';
  isDarkMode = false;

  ngOnInit(): void {
    this.initializeTheme();
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.error = '';

    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load projects', err);
        this.error = 'Could not load projects from the backend.';
        this.loading = false;
      }
    });
  }

  refreshProjects(): void {
    this.refreshing = true;
    this.error = '';

    this.projectService.refreshProjects().subscribe({
      next: () => {
        this.refreshing = false;
        this.loadProjects();
      },
      error: (err) => {
        console.error('Failed to refresh projects', err);
        this.error = 'Could not refresh projects.';
        this.refreshing = false;
      }
    });
  }

  toggleTheme(): void {
    this.applyTheme(!this.isDarkMode);
  }

  hasValidImage(project: Project): boolean {
    return !!project.imageUrl && this.looksLikeImage(project.imageUrl);
  }

  private looksLikeImage(url: string): boolean {
    return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url);
  }

  private initializeTheme(): void {
    const windowRef = this.document.defaultView;
    const savedTheme = windowRef?.localStorage.getItem(this.themeStorageKey);
    const prefersDark = windowRef?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
    const useDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;

    this.applyTheme(useDarkMode, false);
  }

  private applyTheme(useDarkMode: boolean, persist = true): void {
    this.isDarkMode = useDarkMode;
    this.document.body.classList.toggle('theme-dark', useDarkMode);

    if (persist) {
      this.document.defaultView?.localStorage.setItem(
        this.themeStorageKey,
        useDarkMode ? 'dark' : 'light'
      );
    }
  }

  trackByProjectId(index: number, project: Project): number {
    return project.id;
  }
}
