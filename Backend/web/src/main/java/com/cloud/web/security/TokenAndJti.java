package com.cloud.web.security;

import java.time.Instant;

public record TokenAndJti(String token, String jti, Instant expiresAt) {
}
