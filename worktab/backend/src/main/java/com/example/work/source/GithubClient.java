package com.example.work.source;

import com.example.work.config.SourceProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
public class GithubClient {

    private final RestClient restClient;
    private final SourceProperties properties;

    public GithubClient(RestClient restClient, SourceProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    public String fetchReadme(RepoDefinition repo) {
        String url = "https://api.github.com/repos/%s/%s/contents/%s?ref=%s"
                .formatted(repo.getOwnerOrNamespace(), repo.getRepoName(), repo.getReadmePath(), repo.getBranch());

        RestClient.RequestHeadersSpec<?> request = restClient.get()
                .uri(url)
                .header(HttpHeaders.ACCEPT, "application/vnd.github+json");

        String token = properties.getGithub().getToken();
        if (token != null && !token.isBlank()) {
            request = request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        }

        Map<?, ?> response = request.retrieve().body(Map.class);

        if (response == null || response.get("content") == null) {
            throw new IllegalStateException("README not found for " + repo.getRepoName());
        }

        String base64 = response.get("content").toString().replace("\n", "");
        return new String(Base64.getDecoder().decode(base64), StandardCharsets.UTF_8);
    }

    public String buildRepoUrl(RepoDefinition repo) {
        return "https://github.com/%s/%s".formatted(repo.getOwnerOrNamespace(), repo.getRepoName());
    }
}