package com.smartgym.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkoutDayDTO {
	 private String day;
	    private String workoutType;
	    private List<ExerciseDTO> exercises;

	    public WorkoutDayDTO(String day,
	                         String workoutType,
	                         List<ExerciseDTO> exercises) {
	        this.day = day;
	        this.workoutType = workoutType;
	        this.exercises = exercises;
	    }

}
