package com.parallax.backend.parallax;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ParallaxApplication {

	public static void main(String[] args) {
		SpringApplication.run(ParallaxApplication.class, args);
	}

	@org.springframework.context.annotation.Bean
	public com.fasterxml.jackson.databind.ObjectMapper objectMapper() {
		return new com.fasterxml.jackson.databind.ObjectMapper()
				.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
	}
}
