
package com.smartgym.repository;

import com.smartgym.entity.Water;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface WaterRepository extends JpaRepository<Water, Long> {

    Optional<Water> findByWaterDate(LocalDate waterDate);
}
