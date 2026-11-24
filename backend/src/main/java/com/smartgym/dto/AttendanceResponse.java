package com.smartgym.dto;


import java.time.LocalDateTime;

public class AttendanceResponse {
	
	private Long id;
    private Long userId;
    private String userName;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private Long durationMinutes;

    public AttendanceResponse(Long id, Long userId, String userName,
                              LocalDateTime checkInTime, LocalDateTime checkOutTime, Long durationMinutes) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.checkInTime = checkInTime;
        this.checkOutTime = checkOutTime;
        this.durationMinutes = durationMinutes;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public LocalDateTime getCheckInTime() { return checkInTime; }
    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public Long getDurationMinutes() { return durationMinutes; }

}
