package com.smartgym.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostureRequest {
	  @NotNull
	    private Long userId;

	    @NotBlank
	    private String exerciseName;

	    @NotNull
	    @DecimalMin("0.0")
	    @DecimalMax("180.0")
	    private Double kneeAngle;

	    @NotNull
	    @DecimalMin("0.0")
	    @DecimalMax("180.0")
	    private Double backAngle;

}
