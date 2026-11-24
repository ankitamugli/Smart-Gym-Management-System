
package com.smartgym.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartgym.entity.Nutrition;

public interface NutritionRepository
        extends JpaRepository<Nutrition, Long> {

    List<Nutrition> findByMealDate(LocalDate mealDate);
}
