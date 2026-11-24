
package com.smartgym.dto;

import java.time.LocalDateTime;

public class TrainerBookingResponse {

    private Long id;
    private Long trainerId;
    private String trainerName;
    private Long memberId;
    private String memberName;
    private LocalDateTime scheduledAt;
    private String message;
    private String status;
    private LocalDateTime createdAt;

    public TrainerBookingResponse(Long id, Long trainerId,
            String trainerName, Long memberId, String memberName,
            LocalDateTime scheduledAt, String message,
            String status, LocalDateTime createdAt) {

        this.id = id;
        this.trainerId = trainerId;
        this.trainerName = trainerName;
        this.memberId = memberId;
        this.memberName = memberName;
        this.scheduledAt = scheduledAt;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getTrainerId() {
        return trainerId;
    }

    public String getTrainerName() {
        return trainerName;
    }

    public Long getMemberId() {
        return memberId;
    }

    public String getMemberName() {
        return memberName;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public String getMessage() {
        return message;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
