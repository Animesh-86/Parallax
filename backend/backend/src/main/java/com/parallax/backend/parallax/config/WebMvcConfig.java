package com.parallax.backend.parallax.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    public WebMvcConfig(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map /uploads/avatars/** to the physical avatars directory
        if (storageProperties.getAvatars() != null) {
            Path avatarUploadDir = Paths.get(storageProperties.getAvatars());
            String avatarUploadPath = avatarUploadDir.toFile().getAbsolutePath();
            
            registry.addResourceHandler("/uploads/avatars/**")
                    .addResourceLocations("file:" + avatarUploadPath + "/");
        }
    }
}
