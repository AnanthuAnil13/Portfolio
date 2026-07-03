package com.example.work.config;

import com.example.work.source.RepoDefinition;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app")
public class SourceProperties {

    private Cors cors = new Cors();
    private Github github = new Github();
    private Gitlab gitlab = new Gitlab();
    private Sources sources = new Sources();

    public Cors getCors() { return cors; }
    public void setCors(Cors cors) { this.cors = cors; }

    public Github getGithub() { return github; }
    public void setGithub(Github github) { this.github = github; }

    public Gitlab getGitlab() { return gitlab; }
    public void setGitlab(Gitlab gitlab) { this.gitlab = gitlab; }

    public Sources getSources() { return sources; }
    public void setSources(Sources sources) { this.sources = sources; }

    public static class Cors {
        private String allowedOrigin;
        public String getAllowedOrigin() { return allowedOrigin; }
        public void setAllowedOrigin(String allowedOrigin) { this.allowedOrigin = allowedOrigin; }
    }

    public static class Github {
        private String token;
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class Gitlab {
        private String token;
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class Sources {
        private List<RepoDefinition> repos = new ArrayList<>();
        public List<RepoDefinition> getRepos() { return repos; }
        public void setRepos(List<RepoDefinition> repos) { this.repos = repos; }
    }
}