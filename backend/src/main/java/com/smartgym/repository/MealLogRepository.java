package com.smartgym.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.MealLog;

@Repository

public interface MealLogRepository  extends JpaRepository<MealLog, Long>{

    List<MealLog> findByUserIdAndMealDateOrderByIdAsc(Long userId, LocalDate mealDate);

    List<MealLog> findByUserIdOrderByMealDateDescIdDesc(Long userId);

}
