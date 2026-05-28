package com.parallax.backend.parallax.service.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.service.ai.AiReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubService {

    private final ProjectRepository projectRepository;
    private final AiReviewService aiReviewService;
    private final com.parallax.backend.parallax.service.file.FileService fileService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${github.pat}")
    private String githubPat;

    public void handlePullRequestEvent(JsonNode payload) {
        try {
            JsonNode repositoryNode = payload.path("repository");
            String repoHtmlUrl = repositoryNode.path("html_url").asText();
            String cloneUrl = repositoryNode.path("clone_url").asText();

            Optional<Project> projectOpt = projectRepository.findByGithubRepoUrl(repoHtmlUrl);
            if (projectOpt.isEmpty()) {
                projectOpt = projectRepository.findByGithubRepoUrl(cloneUrl);
            }

            if (projectOpt.isPresent()) {
                Project project = projectOpt.get();
                if (Boolean.TRUE.equals(project.isAiReviewEnabled())) {
                    JsonNode prNode = payload.path("pull_request");
                    String diffUrl = prNode.path("diff_url").asText();
                    String commentsUrl = prNode.path("comments_url").asText();
                    
                    log.info("Found project {} for PR. Fetching diff from {}", project.getId(), diffUrl);
                    
                    String diffContent = fetchPrDiff(diffUrl);
                    if (diffContent != null && !diffContent.isEmpty()) {
                        log.info("Diff fetched successfully. Sending to AiReviewService.");
                        aiReviewService.analyzeAndCommentAsync(project, diffContent, commentsUrl, githubPat);
                    } else {
                        log.warn("Fetched empty diff for PR: {}", diffUrl);
                    }
                } else {
                    log.info("Project {} found but AI Review is disabled.", project.getId());
                }
            } else {
                log.info("No Parallax project linked to repo: {}", repoHtmlUrl);
            }
        } catch (Exception e) {
            log.error("Error handling GitHub PR event", e);
        }
    }

    public void importRepositoryToProject(Project project, java.util.UUID userId) {
        if (project.getGithubRepoUrl() == null || project.getGithubRepoUrl().isEmpty()) {
            return;
        }

        try {
            // Extract owner and repo from URL (e.g. https://github.com/owner/repo)
            String url = project.getGithubRepoUrl();
            if (url.endsWith("/")) url = url.substring(0, url.length() - 1);
            if (url.endsWith(".git")) url = url.substring(0, url.length() - 4);

            String[] parts = url.split("/");
            if (parts.length < 2) return;
            String repo = parts[parts.length - 1];
            String owner = parts[parts.length - 2];

            String zipUrl = String.format("https://api.github.com/repos/%s/%s/zipball/HEAD", owner, repo);

            HttpHeaders headers = new HttpHeaders();
            if (githubPat != null && !githubPat.isEmpty() && !githubPat.equals("dummy-pat")) {
                headers.set("Authorization", "Bearer " + githubPat);
            }
            headers.set("Accept", "application/vnd.github.v3+json");

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(zipUrl, HttpMethod.GET, entity, byte[].class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(response.getBody()))) {
                    java.util.zip.ZipEntry zipEntry = zis.getNextEntry();
                    while (zipEntry != null) {
                        String filePath = zipEntry.getName();
                        // The github zipball puts everything inside a root directory (e.g. owner-repo-commitHash/)
                        int firstSlash = filePath.indexOf('/');
                        if (firstSlash != -1 && firstSlash < filePath.length() - 1) {
                            String projectPath = filePath.substring(firstSlash + 1);

                            if (zipEntry.isDirectory()) {
                                try {
                                    fileService.createFile(project.getId(), projectPath, "FOLDER", userId);
                                } catch (Exception e) {
                                    // Ignore already exists
                                }
                            } else {
                                java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
                                int nRead;
                                byte[] data = new byte[1024];
                                while ((nRead = zis.read(data, 0, data.length)) != -1) {
                                    buffer.write(data, 0, nRead);
                                }
                                String content = new String(buffer.toByteArray(), java.nio.charset.StandardCharsets.UTF_8);

                                try {
                                    fileService.createFile(project.getId(), projectPath, "FILE", userId);
                                    fileService.save(project.getId(), projectPath, content, userId);
                                } catch (Exception e) {
                                    log.warn("Failed to create/save file {} in project {}", projectPath, project.getId());
                                }
                            }
                        }
                        zipEntry = zis.getNextEntry();
                    }
                }
                log.info("Successfully imported repository {} into project {}", url, project.getId());
            } else {
                log.error("Failed to download zip from GitHub. Status: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to import repository to project {}", project.getId(), e);
        }
    }

    public void createPullRequest(Project project, String branchName, String prTitle, String commitMessage) {
        if (project.getGithubRepoUrl() == null || project.getGithubRepoUrl().isEmpty()) {
            throw new IllegalStateException("Project is not linked to a GitHub repository.");
        }

        try {
            String url = project.getGithubRepoUrl();
            if (url.endsWith("/")) url = url.substring(0, url.length() - 1);
            if (url.endsWith(".git")) url = url.substring(0, url.length() - 4);

            String[] parts = url.split("/");
            if (parts.length < 2) return;
            String repo = parts[parts.length - 1];
            String owner = parts[parts.length - 2];

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + githubPat);
            headers.set("Accept", "application/vnd.github.v3+json");
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 1. Get default branch (assumed 'main' or 'master') ref to get the latest commit SHA
            String refUrl = String.format("https://api.github.com/repos/%s/%s/git/refs/heads/main", owner, repo);
            ResponseEntity<JsonNode> refResponse;
            try {
                refResponse = restTemplate.exchange(refUrl, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class);
            } catch (Exception e) {
                // fallback to master
                refUrl = String.format("https://api.github.com/repos/%s/%s/git/refs/heads/master", owner, repo);
                refResponse = restTemplate.exchange(refUrl, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class);
            }
            
            String latestCommitSha = refResponse.getBody().path("object").path("sha").asText();

            // 2. Get the commit to get the base tree SHA
            String commitUrl = String.format("https://api.github.com/repos/%s/%s/git/commits/%s", owner, repo, latestCommitSha);
            ResponseEntity<JsonNode> commitResponse = restTemplate.exchange(commitUrl, HttpMethod.GET, new HttpEntity<>(headers), JsonNode.class);
            String baseTreeSha = commitResponse.getBody().path("tree").path("sha").asText();

            // 3. Create a new Tree with the project files
            java.util.List<com.parallax.backend.parallax.entity.file.ProjectFile> files = 
                    fileService.findAll(project.getId(), project.getOwner().getId());
            
            java.util.List<java.util.Map<String, String>> treeNodes = new java.util.ArrayList<>();
            for (com.parallax.backend.parallax.entity.file.ProjectFile f : files) {
                if ("FILE".equals(f.getType())) {
                    java.util.Map<String, String> node = new java.util.HashMap<>();
                    node.put("path", f.getPath());
                    node.put("mode", "100644");
                    node.put("type", "blob");
                    node.put("content", f.getContent() == null ? "" : f.getContent());
                    treeNodes.add(node);
                }
            }

            java.util.Map<String, Object> treeBody = new java.util.HashMap<>();
            treeBody.put("base_tree", baseTreeSha);
            treeBody.put("tree", treeNodes);

            String createTreeUrl = String.format("https://api.github.com/repos/%s/%s/git/trees", owner, repo);
            ResponseEntity<JsonNode> treeResponse = restTemplate.postForEntity(createTreeUrl, new HttpEntity<>(treeBody, headers), JsonNode.class);
            String newTreeSha = treeResponse.getBody().path("sha").asText();

            // 4. Create a new Commit
            java.util.Map<String, Object> newCommitBody = new java.util.HashMap<>();
            newCommitBody.put("message", commitMessage);
            newCommitBody.put("tree", newTreeSha);
            newCommitBody.put("parents", java.util.List.of(latestCommitSha));

            String createCommitUrl = String.format("https://api.github.com/repos/%s/%s/git/commits", owner, repo);
            ResponseEntity<JsonNode> newCommitResponse = restTemplate.postForEntity(createCommitUrl, new HttpEntity<>(newCommitBody, headers), JsonNode.class);
            String newCommitSha = newCommitResponse.getBody().path("sha").asText();

            // 5. Create a new Branch (Reference)
            java.util.Map<String, String> refBody = new java.util.HashMap<>();
            refBody.put("ref", "refs/heads/" + branchName);
            refBody.put("sha", newCommitSha);

            String createRefUrl = String.format("https://api.github.com/repos/%s/%s/git/refs", owner, repo);
            restTemplate.postForEntity(createRefUrl, new HttpEntity<>(refBody, headers), JsonNode.class);

            // 6. Create the Pull Request
            java.util.Map<String, String> prBody = new java.util.HashMap<>();
            prBody.put("title", prTitle);
            prBody.put("head", branchName);
            prBody.put("base", refUrl.endsWith("main") ? "main" : "master");
            prBody.put("body", "PR created from Parallax IDE.\n\n" + commitMessage);

            String createPrUrl = String.format("https://api.github.com/repos/%s/%s/pulls", owner, repo);
            ResponseEntity<JsonNode> prResponse = restTemplate.postForEntity(createPrUrl, new HttpEntity<>(prBody, headers), JsonNode.class);
            
            log.info("Successfully created PR: {}", prResponse.getBody().path("html_url").asText());

        } catch (Exception e) {
            log.error("Failed to create PR for project {}", project.getId(), e);
            throw new RuntimeException("Failed to create Pull Request on GitHub", e);
        }
    }

    private String fetchPrDiff(String diffUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + githubPat);
            // Request the diff media type
            headers.set("Accept", "application/vnd.github.v3.diff");

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(diffUrl, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                log.error("Failed to fetch diff. Status: {}", response.getStatusCode());
                return null;
            }
        } catch (Exception e) {
            log.error("Error fetching PR diff from " + diffUrl, e);
            return null;
        }
    }
}
