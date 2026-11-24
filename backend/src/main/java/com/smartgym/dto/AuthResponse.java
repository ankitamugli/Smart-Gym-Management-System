package com.smartgym.dto;

public record AuthResponse(String token, AuthUser user) {
}