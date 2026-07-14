package com.parallax.backend.parallax.security;

import com.parallax.backend.parallax.config.OAuth2Config;
import org.springframework.security.core.context.SecurityContextHolder;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.repository.auth.RefreshTokenRepository;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.service.auth.AuthService;
import com.parallax.backend.parallax.service.UsernameGenerationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepo;
    private final RefreshTokenRepository refreshRepo;
    private final UsernameGenerationService usernameService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwt;
    private final OAuth2Config oauth2Config;
    private final AuthService authService;
    private final OAuth2AuthorizedClientService authorizedClientService;

    public OAuth2SuccessHandler(
            UserRepository userRepo,
            RefreshTokenRepository refreshRepo,
            UsernameGenerationService usernameService,
            PasswordEncoder passwordEncoder,
            JwtUtils jwt,
            OAuth2Config oauth2Config, AuthService authService,
            OAuth2AuthorizedClientService authorizedClientService
    ) {
        this.userRepo = userRepo;
        this.refreshRepo = refreshRepo;
        this.usernameService = usernameService;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
        this.oauth2Config = oauth2Config;
        this.authService = authService;
        this.authorizedClientService = authorizedClientService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication auth) throws IOException {

        SecurityContextHolder.clearContext();
        OAuth2AuthenticationToken oauth = (OAuth2AuthenticationToken) auth;
        OAuth2User oauthUser = oauth.getPrincipal();

        // Check for link_jwt cookie first so we can bypass email requirement if linking
        String linkJwt = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("link_jwt".equals(c.getName())) {
                    linkJwt = c.getValue();
                    break;
                }
            }
        }

        User user = null;
        if (linkJwt != null && jwt.validate(linkJwt)) {
            try {
                java.util.UUID userId = jwt.getUserId(linkJwt);
                user = userRepo.findById(userId).orElse(null);
            } catch (Exception ignored) {
            }
            
            // Clear the cookie now that we've read it
            org.springframework.http.ResponseCookie clearCookie = org.springframework.http.ResponseCookie.from("link_jwt", "")
                    .path("/")
                    .maxAge(0)
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());
        }

        String email = (String) oauthUser.getAttributes().get("email");

        if (user == null) {
            if (email == null || email.isBlank()) {
                response.sendError(400, "OAuth provider did not supply email");
                return;
            }
            email = email.toLowerCase(Locale.ROOT);
            String finalEmail = email;
            user = userRepo.findByEmail(email).orElseGet(() -> {
                String name = Optional.ofNullable((String) oauthUser.getAttributes().get("name"))
                        .orElse(finalEmail.split("@")[0]);

                String baseUsername = usernameService.suggestFromNameOrEmail(name, finalEmail);
                String username = usernameService.generateAvailableUsername(baseUsername);

                String randomPwd = java.util.UUID.randomUUID().toString();
                String hashed = passwordEncoder.encode(randomPwd);

                User u = new User(
                        name,
                        username,
                        finalEmail,
                        hashed,
                        oauth.getAuthorizedClientRegistrationId().toUpperCase()
                );
                u.setOnboardingComplete(false);
                return userRepo.save(u);
            });
        }

        // Save GitHub access token
        if ("GITHUB".equalsIgnoreCase(oauth.getAuthorizedClientRegistrationId())) {
            OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                    oauth.getAuthorizedClientRegistrationId(), oauth.getName());
            if (client != null && client.getAccessToken() != null) {
                user.setGithubAccessToken(client.getAccessToken().getTokenValue());
                userRepo.save(user);
            }
        }

        // ---- Refresh Token & DB session (USE AUTH SERVICE TO AVOID HASHING MISMATCH) ----
        var gen = authService.createRefreshForUser(
                    user, 
                    request.getHeader("User-Agent"), 
                    request.getRemoteAddr()
            );
        String refreshJwt = gen.refreshJwt();

        // ---- Access Token ----
        String access = jwt.generateAccessToken(user.getId(), user.getUsername(), user.getEmail(),
                user.getFullName(), user.isOnboardingComplete());

        // ---- Cookie ----
        ResponseCookie cookie = CookieFactory.refreshToken(refreshJwt, jwt.getRefreshExpirationMs());

        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // ---- Redirect to FRONTEND ----
        String redirectUrl = oauth2Config.getFrontendBaseUrl()
                + "/oauth-success?access="
                + URLEncoder.encode(access, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }

    private String hash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(
                    digest.digest(input.getBytes(StandardCharsets.UTF_8))
            );
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
