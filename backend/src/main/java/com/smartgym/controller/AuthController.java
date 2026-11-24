package com.smartgym.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.AuthResponse;
import com.smartgym.dto.AuthUser;
import com.smartgym.dto.LoginRequest;
import com.smartgym.dto.RegisterRequest;
import com.smartgym.entity.User;
import com.smartgym.security.JwtService;
import com.smartgym.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.registerUser(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(jwtService.generate(user), AuthUser.from(user)));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User user = userService.loginUser(req.getEmail(), req.getPassword());
        return new AuthResponse(jwtService.generate(user), AuthUser.from(user));
    }

    @PostMapping("/logout")
    public Map<String, Boolean> logout() {
        return Map.of("ok", true);
    }
}