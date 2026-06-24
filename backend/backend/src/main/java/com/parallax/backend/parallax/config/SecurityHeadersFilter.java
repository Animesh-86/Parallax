package com.parallax.backend.parallax.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Applies industry-standard security headers to all HTTP responses.
 *
 * <ul>
 *   <li><b>Content-Security-Policy</b> — Restricts script, style, frame, and connect sources
 *       to prevent XSS, clickjacking, and data exfiltration.</li>
 *   <li><b>X-Content-Type-Options</b> — Prevents MIME-type sniffing attacks.</li>
 *   <li><b>X-Frame-Options</b> — Prevents the platform from being embedded in iframes (clickjacking).</li>
 *   <li><b>Referrer-Policy</b> — Limits referrer information leakage.</li>
 *   <li><b>Permissions-Policy</b> — Disables dangerous browser APIs (camera, microphone, geolocation)
 *       at the HTTP level so user JS code cannot request them.</li>
 * </ul>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Content-Security-Policy
        String csp = String.join("; ",
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
                "connect-src 'self' ws: wss: " + frontendUrl,
                "frame-src http://*.preview.parallax.run https://*.preview.parallax.run " + frontendUrl + " " + frontendUrl.replace("http://", "ws://").replace("https://", "wss://"),
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "object-src 'none'"
        );
        response.setHeader("Content-Security-Policy", csp);

        // Prevent MIME-type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");

        // Prevent clickjacking — platform should never be iframed
        response.setHeader("X-Frame-Options", "DENY");

        // Limit referrer leakage
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Disable dangerous browser APIs
        response.setHeader("Permissions-Policy",
                "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

        // HSTS
        response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains");

        // Request tracing
        String requestId = UUID.randomUUID().toString();
        response.setHeader("X-Request-ID", requestId);
        request.setAttribute("requestId", requestId);

        // Strip server identification
        response.setHeader("Server", "");

        // Prevent caching of authenticated responses
        String path = request.getRequestURI();
        if (path.startsWith("/api/") && !path.equals("/api/health")) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            response.setHeader("Pragma", "no-cache");
        }

        filterChain.doFilter(request, response);
    }
}
