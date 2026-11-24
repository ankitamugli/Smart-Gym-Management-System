package com.smartgym.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.LoginRequest;
import com.smartgym.dto.RegisterRequest;
import com.smartgym.dto.UserResponse;
import com.smartgym.entity.User;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> registerUser(@Valid @RequestBody RegisterRequest request) {

        userService.registerUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "User Registered Successfully! 🎉", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> loginUser(@Valid @RequestBody LoginRequest request) {

        User user = userService.loginUser(request.getEmail(), request.getPassword());

        UserResponse response = new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Login Successful! Welcome back, " + user.getFullName() + " 💪", response)
        );
    }
}