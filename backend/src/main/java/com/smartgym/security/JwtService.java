package com.smartgym.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.smartgym.entity.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;
    private final SecretKey qrKey;
    private final long expiryMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiry-minutes:60}") long minutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.qrKey = Keys.hmacShaKeyFor((secret + "-qr").getBytes(StandardCharsets.UTF_8));
        this.expiryMs = minutes * 60_000;
    }

    // Login token
    public String generate(User user) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("role", user.getRole())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiryMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }

    // QR token: 5 minute chalta hai, alag key se, login ke liye kaam nahi karta
    public String generateQr(Long userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 5 * 60_000))
                .signWith(qrKey)
                .compact();
    }

    public Claims parseQr(String token) {
        return Jwts.parser().verifyWith(qrKey).build()
                .parseSignedClaims(token).getPayload();
    }
}