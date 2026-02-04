package com.cloud.web.security;

import io.jsonwebtoken.Claims;

import java.time.Instant;

public record JwtPayload(String subject, String jti, Instant expiresAt, Claims claims) {
}
