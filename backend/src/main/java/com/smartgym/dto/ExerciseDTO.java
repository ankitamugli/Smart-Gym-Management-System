package com.smartgym.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExerciseDTO {
	
	private String exerciseName;
    private Integer sets;
    private Integer reps;
    private Integer restSeconds;

    public ExerciseDTO(String exerciseName,
                       Integer sets,
                       Integer reps,
                       Integer restSeconds) {
        this.exerciseName = exerciseName;
        this.sets = sets;
        this.reps = reps;
        this.restSeconds = restSeconds;
    }

}
