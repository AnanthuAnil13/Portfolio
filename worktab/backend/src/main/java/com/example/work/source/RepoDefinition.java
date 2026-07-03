package com.example.work.source;

public class RepoDefinition {
    private RepoSource source;
    private String ownerOrNamespace;
    private String repoName;
    private String branch;
    private String readmePath;

    public RepoSource getSource() { return source; }
    public void setSource(RepoSource source) { this.source = source; }

    public String getOwnerOrNamespace() { return ownerOrNamespace; }
    public void setOwnerOrNamespace(String ownerOrNamespace) { this.ownerOrNamespace = ownerOrNamespace; }

    public String getRepoName() { return repoName; }
    public void setRepoName(String repoName) { this.repoName = repoName; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getReadmePath() { return readmePath; }
    public void setReadmePath(String readmePath) { this.readmePath = readmePath; }
}