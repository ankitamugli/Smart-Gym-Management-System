package com.smartgym.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartgym.entity.DietGoal;
public interface DietGoalRepository  extends JpaRepository<DietGoal, Long> {

    Optional<DietGoal> findByUserId(Long userId);

}
