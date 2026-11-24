package com.smartgym.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.AuthUser;
import com.smartgym.entity.User;
import com.smartgym.repository.UserRepository;
import com.smartgym.security.CurrentUser;

@RestController
@RequestMapping("/api/v1/users")
public class MeController {

    private final UserRepository userRepository;

    public MeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public AuthUser me() {
        return AuthUser.from(findCurrent());
    }

    @PatchMapping("/me")
    public AuthUser update(@RequestBody Map<String, String> patch) {
        User u = findCurrent();
        String name = patch.get("name");
        if (name != null && !name.isBlank()) {
            u.setFullName(name.trim());
        }
        if (patch.containsKey("phone")) {
            u.setPhone(patch.get("phone"));
        }
        return AuthUser.from(userRepository.save(u));
    }

    private User findCurrent() {
        return userRepository.findById(CurrentUser.id())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}