package com.parallax.backend.parallax.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "parallax.storage")
@Getter
@Setter
public class StorageProperties {
    private String root;       // e.g. C:/Users/Animesh/parallax
    private String projects;   // e.g. C:/Users/Animesh/parallax/projects
    private String sessions;   // e.g. C:/Users/Animesh/parallax/sessions
}
