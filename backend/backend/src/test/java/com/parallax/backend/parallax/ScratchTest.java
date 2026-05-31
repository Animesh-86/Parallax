package com.parallax.backend.parallax;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.parallax.backend.parallax.service.project.ProjectService;
import com.parallax.backend.parallax.dto.project.CreateProjectRequest;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.entity.auth.User;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
public class ScratchTest {

    @Autowired
    com.parallax.backend.parallax.service.execution.RunCodeService runCodeService;

    @Autowired
    com.parallax.backend.parallax.store.SessionRegistry sessionRegistry;

    @Autowired
    com.parallax.backend.parallax.repository.file.ProjectFileRepository fr;

    @Autowired
    ProjectService ps;

    @Autowired
    UserRepository ur;

    @Test
    public void test() throws Exception {
        if (ur.findAll().isEmpty()) {
            User u = new User("Test User", "testuser", "test@test.com", "pass", "LOCAL");
            ur.save(u);
        }
        User u = ur.findAll().get(0);
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("test" + System.currentTimeMillis());
        req.setLanguage("python");
        req.setGithubRepoUrl("https://github.com/expressjs/express");
        var pr = ps.createProject(req, u.getId());
        
        var pid = pr.getId();
        
        com.parallax.backend.parallax.entity.file.ProjectFile f = new com.parallax.backend.parallax.entity.file.ProjectFile();
        f.setId(java.util.UUID.randomUUID());
        f.setProjectId(pid);
        f.setPath("main.py");
        f.setType("FILE");
        f.setContent("print('Hello from test')");
        fr.save(f);
        
        String sessId = java.util.UUID.randomUUID().toString();
        sessionRegistry.register(pid, sessId, "dummy", u.getId(), "python", null);
        
        com.parallax.backend.parallax.dto.execution.CommandResult cr = runCodeService.runCodeInSession(
            sessId, "main.py", 10, u.getId(), line -> System.out.println("OUTPUT: " + line)
        );
        
        System.out.println("EXIT CODE: " + cr.getExitCode());
        System.out.println("FINAL OUT: " + cr.getOutput());
    }
}
