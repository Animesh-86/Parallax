package com.parallax.backend.parallax.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI parallaxOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Parallax IDE API")
                        .version("1.0.0")
                        .description("Browser-based collaborative IDE with real-time editing, "
                                + "Docker sandboxes, and AI assistance")
                        .contact(new Contact()
                                .name("Animesh Sharma")
                                .url("https://github.com/Animesh-86/Parallax")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Access token from /api/v1/auth/login")));
    }
}
