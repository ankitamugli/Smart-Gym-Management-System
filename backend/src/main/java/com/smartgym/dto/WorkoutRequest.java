package com.smartgym.dto;


import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkoutRequest {
	

    @NotNull
    private Long userId;

    @NotBlank
    private String fitnessGoal;

    @NotBlank
    private String fitnessLevel;

    @NotNull
    @Min(1)
    @Max(6)
    private Integer daysPerWeek;

    @NotBlank
    private String equipment;

}
