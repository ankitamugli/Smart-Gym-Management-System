package com.smartgym.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartgym.entity.WorkoutPlan;

public interface WorkoutPlanRepository  extends JpaRepository<WorkoutPlan, Long>{
	

    List<WorkoutPlan> findByUserIdOrderByCreatedAtDesc(Long userId);

}
