package com.example.work.source;

import com.example.work.config.SourceProperties;
import com.example.work.project.Project;
import com.example.work.project.ProjectRepository;
import com.example.work.project.ReadmeParser;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class SourceSyncService {

    private final SourceProperties properties;
    private final GithubClient githubClient;
    private final ProjectRepository projectRepository;
    private final ReadmeParser readmeParser;

    public SourceSyncService(
            SourceProperties properties,
            GithubClient githubClient,
            ProjectRepository projectRepository,
            ReadmeParser readmeParser
    ) {
        this.properties = properties;
        this.githubClient = githubClient;
        this.projectRepository = projectRepository;
        this.readmeParser = readmeParser;
    }

    public SyncSummary syncAll() {
        List<RepoDefinition> repos = properties.getSources().getRepos();
        List<SyncResult> results = new ArrayList<>();
        int successCount = 0;
        int failedCount = 0;

        for (RepoDefinition repo : repos) {
            String repoLabel = repo.getOwnerOrNamespace() + "/" + repo.getRepoName();

            try {
                if (repo.getSource() == RepoSource.github) {
                    System.out.println("Syncing GitHub repo: " + repoLabel);
                    syncGithubRepo(repo);
                    results.add(new SyncResult(repoLabel, "success", "Synced successfully"));
                    successCount++;
                } else {
                    results.add(new SyncResult(repoLabel, "skipped", "Source type not implemented yet"));
                }
            } catch (Exception e) {
                System.err.println("Failed to sync repo: " + repoLabel);
                e.printStackTrace();
                results.add(new SyncResult(repoLabel, "failed", rootMessage(e)));
                failedCount++;
            }
        }

        return new SyncSummary(successCount, failedCount, results);
    }

    private void syncGithubRepo(RepoDefinition repo) {
        System.out.println("Fetching README for: " + repo.getOwnerOrNamespace() + "/" + repo.getRepoName());

        String readme = githubClient.fetchReadme(repo);
        String repoUrl = githubClient.buildRepoUrl(repo);

        System.out.println("Parsing frontmatter for: " + repo.getRepoName());
        Map<String, Object> metadata = readmeParser.parseFrontmatter(readme);

        Project project = projectRepository
                .findExistingProject(
                        repo.getSource(),
                        repo.getOwnerOrNamespace(),
                        repo.getRepoName()
                )
                .orElseGet(Project::new);

        System.out.println("Saving project: " + repo.getRepoName());

        project.setSource(repo.getSource());
        project.setOwnerOrNamespace(repo.getOwnerOrNamespace());
        project.setRepoName(repo.getRepoName());
        project.setBranch(repo.getBranch());
        project.setRepoUrl(valueOrDefault(readmeParser.getString(metadata, "repoURL"), repoUrl));
        project.setTitle(valueOrDefault(readmeParser.getString(metadata, "title"), repo.getRepoName()));
        project.setDescription(readmeParser.getString(metadata, "shortDescription"));
        project.setLiveUrl(readmeParser.getString(metadata, "liveURL"));
        project.setImageUrl(readmeParser.getString(metadata, "imageURL"));
        project.setTags(readmeParser.getTagsAsCsv(metadata, "technologies"));
        project.setCategory(readmeParser.getString(metadata, "category"));
        project.setFeatured(readmeParser.getBoolean(metadata, "featured", false));
        project.setDisplayOrder(readmeParser.getInteger(metadata, "order", 9999));
        project.setStatus(readmeParser.getString(metadata, "status"));
        project.setYear(readmeParser.getInteger(metadata, "year", null));
        project.setPlatform(readmeParser.getString(metadata, "platform"));
        project.setVisibility(valueOrDefault(readmeParser.getString(metadata, "visibility"), "public"));
        project.setReadmeRaw(readme);
        project.setLastSyncedAt(OffsetDateTime.now());

        projectRepository.save(project);

        System.out.println("Saved project successfully: " + repo.getRepoName());
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String rootMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current.getMessage() == null ? "Unknown error" : current.getMessage();
    }
}