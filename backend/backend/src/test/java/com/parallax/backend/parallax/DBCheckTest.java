package com.parallax.backend.parallax;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.repository.file.ProjectFileRepository;
import com.parallax.backend.parallax.entity.project.Project;
import com.parallax.backend.parallax.entity.file.ProjectFile;

import java.util.List;

@SpringBootTest
public class DBCheckTest {

    @Autowired
    ProjectRepository pr;

    @Autowired
    ProjectFileRepository pfr;

    @Test
    public void test() {
        List<Project> projects = pr.findAll();
        System.out.println("====== DB CHECK ======");
        for(Project p : projects) {
            System.out.println("PROJECT: " + p.getId() + " | " + p.getName());
            List<ProjectFile> files = pfr.findByProjectId(p.getId());
            System.out.println("FILES: " + files.size());
        }
        System.out.println("======================");
    }
}
