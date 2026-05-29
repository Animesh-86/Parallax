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
    ProjectService ps;

    @Autowired
    UserRepository ur;

    @Test
    public void test() {
        if (ur.findAll().isEmpty()) {
            User u = new User("Test User", "testuser", "test@test.com", "pass", "LOCAL");
            ur.save(u);
        }
        User u = ur.findAll().get(0);
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("test" + System.currentTimeMillis());
        req.setLanguage("python");
        req.setGithubRepoUrl("https://github.com/expressjs/express");
        ps.createProject(req, u.getId());
    }
}
