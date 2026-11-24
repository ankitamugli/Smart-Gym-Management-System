
package com.smartgym.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.Equipment;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    List<Equipment> findByAvailableQuantityGreaterThan(Integer quantity);

    List<Equipment> findByStatusIgnoreCase(String status);

    List<Equipment> findByCategoryIgnoreCase(String category);
}
