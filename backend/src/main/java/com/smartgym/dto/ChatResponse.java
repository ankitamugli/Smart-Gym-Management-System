
package com.smartgym.dto;

import java.time.LocalDateTime;

public class ChatResponse {

    private Long id;
    private Long userId;
    private String message;
    private String response;
    private String category;
    private LocalDateTime createdAt;

    public ChatResponse() {
    }

    public ChatResponse(Long id, Long userId, String message,
            String response, String category, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.message = message;
        this.response = response;
        this.category = category;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
