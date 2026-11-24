package com.smartgym.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostureResponse {
	
	 private Long id;

	    private Long userId;

	    private String exerciseName;

	    private Double kneeAngle;

	    private Double backAngle;

	    private Integer score;

	    private String postureStatus;

	    private String feedback;

	    private LocalDateTime createdAt;

}
