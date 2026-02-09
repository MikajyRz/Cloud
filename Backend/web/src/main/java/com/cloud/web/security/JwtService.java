package com.cloud.web.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long ttlMinutes;

    public JwtService(@Value("${auth.jwt.secret}") String secret,
                      @Value("${auth.jwt.ttlMinutes}") long ttlMinutes) {
        this.secretKey = Keys.hmacShaKeyFor(resolveSecretBytes(secret));
        this.ttlMinutes = ttlMinutes;
    }

    private static byte[] resolveSecretBytes(String secret) {
        try {
            return Decoders.BASE64.decode(secret);
        } catch (Exception ignored) {
            try {
                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                return sha256.digest(secret.getBytes(StandardCharsets.UTF_8));
            } catch (Exception ex) {
                throw new IllegalStateException("Cannot initialize JWT secret", ex);
            }
        }
    }

    public TokenAndJti issueToken(String subject, Map<String, Object> claims) {
        String jti = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant exp = now.plus(ttlMinutes, ChronoUnit.MINUTES);

        String token = Jwts.builder()
                .subject(subject)
                .id(jti)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claims(claims)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();

        return new TokenAndJti(token, jti, exp);
    }

    public TokenAndJti issueTokenWithDuration(String subject, Map<String, Object> claims, int durationMinutes) {
        String jti = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant exp = now.plus(durationMinutes, ChronoUnit.MINUTES);

        String token = Jwts.builder()
                .subject(subject)
                .id(jti)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claims(claims)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();

        return new TokenAndJti(token, jti, exp);
    }

    public JwtPayload parseAndValidate(String token) {
        var jws = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);

        var claims = jws.getPayload();
        return new JwtPayload(
                claims.getSubject(),
                claims.getId(),
                claims.getExpiration().toInstant(),
                claims
        );
    }
}
