package com.parallax.backend.parallax.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Component
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String COOKIE_NAME = "oauth2_auth_request";
    private static final int COOKIE_EXPIRE_SECONDS = 180;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        Cookie cookie = getCookie(request, COOKIE_NAME);
        if (cookie == null) return null;

        return deserialize(cookie.getValue());
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (authorizationRequest == null) {
            removeAuthorizationRequestCookies(response);
            return;
        }

        String serialized = serialize(authorizationRequest);
        Cookie cookie = new Cookie(COOKIE_NAME, serialized);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(COOKIE_EXPIRE_SECONDS);

        response.addCookie(cookie);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        OAuth2AuthorizationRequest req = loadAuthorizationRequest(request);
        removeAuthorizationRequestCookies(response);
        return req;
    }

    // ------------------ helpers --------------------

    private Cookie getCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;

        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) return c;
        }
        return null;
    }

    private void removeAuthorizationRequestCookies(HttpServletResponse res) {
        Cookie cookie = new Cookie(COOKIE_NAME, null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        res.addCookie(cookie);
    }

    private String serialize(OAuth2AuthorizationRequest obj) {
        try {
            Map<String, Object> payload = Map.of(
                    "authorizationUri", obj.getAuthorizationUri(),
                    "clientId", obj.getClientId(),
                    "redirectUri", obj.getRedirectUri(),
                    "state", obj.getState(),
                    "responseType", obj.getResponseType() != null ? obj.getResponseType().getValue() : "code",
                    "grantType", obj.getGrantType() != null ? obj.getGrantType().getValue() : AuthorizationGrantType.AUTHORIZATION_CODE.getValue(),
                    "authorizationRequestUri", obj.getAuthorizationRequestUri(),
                    "scopes", obj.getScopes(),
                    "attributes", obj.getAttributes(),
                    "additionalParameters", obj.getAdditionalParameters()
            );
            byte[] bytes = objectMapper.writeValueAsBytes(payload);
            return Base64.getUrlEncoder().encodeToString(bytes);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize OAuth2 authorization request", e);
        }
    }

    private OAuth2AuthorizationRequest deserialize(String value) {
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(value);
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = objectMapper.readValue(bytes, Map.class);

            String authorizationUri = (String) payload.get("authorizationUri");
            String clientId = (String) payload.get("clientId");
            String redirectUri = (String) payload.get("redirectUri");
            String state = (String) payload.get("state");
            String authorizationRequestUri = (String) payload.get("authorizationRequestUri");

            Set<String> scopes = new LinkedHashSet<>();
            Object scopesRaw = payload.get("scopes");
            if (scopesRaw instanceof Iterable<?> iterable) {
                for (Object s : iterable) {
                    if (s != null) scopes.add(String.valueOf(s));
                }
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> attributes = payload.get("attributes") instanceof Map<?, ?> m
                    ? (Map<String, Object>) m
                    : Collections.emptyMap();

            @SuppressWarnings("unchecked")
            Map<String, Object> additionalParameters = payload.get("additionalParameters") instanceof Map<?, ?> m
                    ? (Map<String, Object>) m
                    : Collections.emptyMap();

            OAuth2AuthorizationRequest.Builder builder = OAuth2AuthorizationRequest.authorizationCode()
                    .authorizationUri(authorizationUri)
                    .clientId(clientId)
                    .redirectUri(redirectUri)
                    .state(state)
                    .scopes(scopes);

            if (authorizationRequestUri != null && !authorizationRequestUri.isBlank()) {
                builder.authorizationRequestUri(authorizationRequestUri);
            }

            builder.attributes(attrs -> attrs.putAll(attributes));
            builder.additionalParameters(params -> params.putAll(additionalParameters));

            return builder.build();
        } catch (IllegalArgumentException | IOException | ClassCastException e) {
            return null;
        }
    }
}
