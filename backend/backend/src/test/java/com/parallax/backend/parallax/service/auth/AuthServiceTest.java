package com.parallax.backend.parallax.service.auth;

import com.parallax.backend.parallax.dto.auth.LoginRequest;
import com.parallax.backend.parallax.dto.auth.SignupRequest;
import com.parallax.backend.parallax.entity.auth.RefreshToken;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.auth.RefreshTokenRepository;
import com.parallax.backend.parallax.security.JwtUtils;
import com.parallax.backend.parallax.service.UsernameGenerationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwt;

    @Mock
    private UsernameGenerationService usernameService;

    @Mock
    private RefreshTokenRepository refreshTokenRepo;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("Test User", "testuser", "test@test.com", "hashedPassword", "LOCAL");
        org.springframework.test.util.ReflectionTestUtils.setField(testUser, "id", UUID.randomUUID());
    }

    @Test
    void signup_Success() {
        SignupRequest req = new SignupRequest();
        req.setFullName("Test User");
        req.setEmail("test@test.com");
        req.setPassword("password123");

        when(userRepo.existsByEmail("test@test.com")).thenReturn(false);
        when(usernameService.suggestFromNameOrEmail(any(), any())).thenReturn("testuser");
        when(usernameService.generateAvailableUsername(any())).thenReturn("testuser");
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");
        when(userRepo.save(any(User.class))).thenReturn(testUser);
        when(jwt.generateAccessToken(testUser.getId(), testUser.getUsername(), testUser.getEmail())).thenReturn("mockedAccessToken");

        String token = authService.signup(req);

        assertEquals("mockedAccessToken", token);
        verify(userRepo).save(any(User.class));
    }

    @Test
    void signup_EmailAlreadyInUse_ThrowsException() {
        SignupRequest req = new SignupRequest();
        req.setEmail("test@test.com");

        when(userRepo.existsByEmail("test@test.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.signup(req));
        verify(userRepo, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@test.com");
        req.setPassword("password123");

        when(userRepo.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", testUser.getPasswordHash())).thenReturn(true);
        when(jwt.generateAccessToken(testUser.getId(), testUser.getUsername(), testUser.getEmail())).thenReturn("mockedAccessToken");

        String token = authService.login(req);

        assertEquals("mockedAccessToken", token);
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        LoginRequest req = new LoginRequest();
        req.setEmail("test@test.com");
        req.setPassword("wrongpassword");

        when(userRepo.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpassword", testUser.getPasswordHash())).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> authService.login(req));
    }

    @Test
    void rotateRefresh_Success() {
        String oldSession = "oldSession123";
        RefreshToken rt = new RefreshToken();
        rt.setUserId(testUser.getId());
        rt.setSessionId(oldSession);
        rt.setExpiresAt(Instant.now().plusMillis(10000));
        rt.setRevoked(false);

        when(refreshTokenRepo.findBySessionIdAndRevokedFalse(oldSession)).thenReturn(Optional.of(rt));
        when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(jwt.generateRefreshToken(eq(testUser.getId()), anyString())).thenReturn("newRefreshJwt");
        when(jwt.generateAccessToken(testUser.getId(), testUser.getUsername(), testUser.getEmail())).thenReturn("newAccessJwt");

        AuthService.RotatedTokens tokens = authService.rotateRefresh(oldSession, "agent", "127.0.0.1");

        assertNotNull(tokens);
        assertEquals("newAccessJwt", tokens.accessToken());
        assertEquals("newRefreshJwt", tokens.refreshJwt());
        verify(refreshTokenRepo).revokeBySessionId(oldSession);
        verify(refreshTokenRepo).save(any(RefreshToken.class));
    }
}
