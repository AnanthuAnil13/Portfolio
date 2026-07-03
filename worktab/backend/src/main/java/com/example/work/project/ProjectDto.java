package com.example.work.project;

import java.util.Arrays;
import java.util.List;

public record ProjectDto(
        Long id,
        String source,
        String ownerOrNamespace,
        String repoName,
        String title,
        String description,
        String repoUrl,
        String liveUrl,
        String imageUrl,
        List<String> tags,
        boolean featured,
        Integer displayOrder,
        String category,
        String status,
        Integer year,
        String platform,
        String visibility
) {
    public static ProjectDto fromEntity(Project project) {
        List<String> parsedTags = project.getTags() == null || project.getTags().isBlank()
                ? List.of()
                : Arrays.stream(project.getTags().split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        return new ProjectDto(
                project.getId(),
                project.getSource() == null ? null : project.getSource().name(),
                project.getOwnerOrNamespace(),
                project.getRepoName(),
                project.getTitle(),
                project.getDescription(),
                project.getRepoUrl(),
                project.getLiveUrl(),
                project.getImageUrl(),
                parsedTags,
                project.isFeatured(),
                project.getDisplayOrder(),
                project.getCategory(),
                project.getStatus(),
                project.getYear(),
                project.getPlatform(),
                project.getVisibility()
        );
    }
}