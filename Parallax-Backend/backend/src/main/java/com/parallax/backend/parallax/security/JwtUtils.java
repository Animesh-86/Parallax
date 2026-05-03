package com.parallax.backend.parallax.security;

import com.parallax.backend.parallax.exception.UnauthorizedException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    private final Key key;
    private final long accessExpiryMs;
    private final long refreshExpiryMs;

    public JwtUtils(JwtProperties props) {
        this.key = buildSigningKey(props.getSecret());
        this.accessExpiryMs = props.getAccessExpirationMs();
        this.refreshExpiryMs = props.getRefreshExpirationMs();
    }

    private Key buildSigningKey(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT secret is missing. Set app.jwt.secret or JWT_SECRET.");
        }

        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length >= 32) {
            return Keys.hmacShaKeyFor(secretBytes);
        }

        log.warn("JWT secret is shorter than 32 bytes; deriving a 256-bit key for compatibility. Use a 32+ byte secret in production.");
        try {
            byte[] derived = MessageDigest.getInstance("SHA-256").digest(secretBytes);
            return Keys.hmacShaKeyFor(derived);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to initialize JWT signing key", e);
        }
    }

    public String generateAccessToken(UUID userId, String username, String email) {
        Instant now = Instant.now();

        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("username", username)
                .claim("email", email)
                .claim("type", "access")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(accessExpiryMs)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(UUID userId, String sessionId) {
        Instant now = Instant.now();

        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("sid", sessionId)
                .claim("type", "refresh")
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(refreshExpiryMs)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    private Claims parseClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            throw new UnauthorizedException("Invalid or expired JWT");
        }
    }

    public boolean validate(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (UnauthorizedException e) {
            return false;
        }
    }

    public void validateAccessToken(String token) {
        Claims claims = parseClaims(token);
        if (!"access".equals(claims.get("type", String.class))) {
            throw new UnauthorizedException("Not an access token");
        }
    }

    public void validateRefreshToken(String token) {
        Claims claims = parseClaims(token);
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new UnauthorizedException("Not a refresh token");
        }
    }

    public UUID getUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public UUID getUserIdFromToken(String token) {
        return getUserId(token);
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(parseClaims(token).get("type", String.class));
    }

    public String getSessionId(String refreshToken) {
        return parseClaims(refreshToken).get("sid", String.class);
    }

    public Instant getExpiry(String token) {
        return parseClaims(token).getExpiration().toInstant();
    }

    public long getRefreshExpiryMs() {
        return refreshExpiryMs;
    }
}
