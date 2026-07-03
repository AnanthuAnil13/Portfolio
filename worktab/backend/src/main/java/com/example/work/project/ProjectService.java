package com.example.work.project;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<ProjectDto> getAllProjects() {
        return projectRepository
                .findAllByVisibilityIgnoreCaseOrderByFeaturedDescDisplayOrderAscTitleAsc("public")
                .stream()
                .map(ProjectDto::fromEntity)
                .toList();
    }
}