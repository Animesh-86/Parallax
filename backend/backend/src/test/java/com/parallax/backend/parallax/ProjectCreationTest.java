package com.parallax.backend.parallax;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.parallax.backend.parallax.service.project.ProjectService;
import com.parallax.backend.parallax.dto.project.CreateProjectRequest;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;

@SpringBootTest
public class ProjectCreationTest {
    @Autowired ProjectService ps;
    @Autowired UserRepository ur;
    @Autowired ProjectFileRepository pfr;
    
    @Test
    public void test() {
        User u = new User("Test", "test", "test@test.com", "pass", "LOCAL");
        ur.save(u);
        CreateProjectRequest req = new CreateProjectRequest();
        req.setName("TestRepo");
        req.setLanguage("none");
        req.setGithubRepoUrl("https://github.com/expressjs/express");
        var res = ps.createProject(req, u.getId());
        
        System.out.println("PROJECT CREATED: " + res.getId());
        long count = pfr.count();
        System.out.println("TOTAL FILES IN DB: " + count);
    }
}
