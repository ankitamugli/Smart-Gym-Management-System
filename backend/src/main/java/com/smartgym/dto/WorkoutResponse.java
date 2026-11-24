package com.smartgym.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkoutResponse {

	private Long id;
    private Long userId;
    private String fitnessGoal;
    private String fitnessLevel;
    private Integer daysPerWeek;
    private String equipment;
    private List<WorkoutDayDTO> workoutSchedule;
    private LocalDateTime createdAt;
}
