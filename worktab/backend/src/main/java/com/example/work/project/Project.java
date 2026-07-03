package com.example.work.project;

import com.example.work.source.RepoSource;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "projects",
        uniqueConstraints = @UniqueConstraint(columnNames = {"source", "ownerOrNamespace", "repoName"})
)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private RepoSource source;

    private String ownerOrNamespace;
    private String repoName;
    private String branch;

    private String title;

    @Column(length = 2000)
    private String description;

    private String repoUrl;
    private String liveUrl;
    private String imageUrl;

    @Column(length = 2000)
    private String tags;

    private boolean featured;
    private Integer displayOrder;
    private String category;
    private String status;
    private Integer year;
    private String platform;
    private String visibility;

    @Column(length = 20000)
    private String readmeRaw;

    private OffsetDateTime lastSyncedAt;

    public Long getId() { return id; }

    public RepoSource getSource() { return source; }
    public void setSource(RepoSource source) { this.source = source; }

    public String getOwnerOrNamespace() { return ownerOrNamespace; }
    public void setOwnerOrNamespace(String ownerOrNamespace) { this.ownerOrNamespace = ownerOrNamespace; }

    public String getRepoName() { return repoName; }
    public void setRepoName(String repoName) { this.repoName = repoName; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRepoUrl() { return repoUrl; }
    public void setRepoUrl(String repoUrl) { this.repoUrl = repoUrl; }

    public String getLiveUrl() { return liveUrl; }
    public void setLiveUrl(String liveUrl) { this.liveUrl = liveUrl; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public String getReadmeRaw() { return readmeRaw; }
    public void setReadmeRaw(String readmeRaw) { this.readmeRaw = readmeRaw; }

    public OffsetDateTime getLastSyncedAt() { return lastSyncedAt; }
    public void setLastSyncedAt(OffsetDateTime lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }
}