package com.smartgym.dto;

import jakarta.validation.constraints.NotBlank;

public class CheckInRequest {

    @NotBlank(message = "QR token is required")
    private String qrToken;

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }
}