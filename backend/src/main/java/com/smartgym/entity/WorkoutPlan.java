package com.smartgym.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "workout_plans")
@Getter
@Setter
public class WorkoutPlan {
	

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String fitnessGoal;

    private String fitnessLevel;

    private Integer daysPerWeek;

    private String equipment;

    @Column(columnDefinition = "TEXT")
    private String workoutSchedule;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

}
