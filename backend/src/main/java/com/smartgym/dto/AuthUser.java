package com.smartgym.dto;

import com.smartgym.entity.User;

public record AuthUser(String id, String name, String email, String memberId) {

    public static AuthUser from(User u) {
        return new AuthUser(
                String.valueOf(u.getId()),
                u.getFullName(),
                u.getEmail(),
                String.format("FRM-%06d", u.getId()));
    }
}