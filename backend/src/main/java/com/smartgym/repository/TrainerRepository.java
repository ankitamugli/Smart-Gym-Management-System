
package com.smartgym.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.Trainer;

@Repository
public interface TrainerRepository extends JpaRepository<Trainer, Long> {

    boolean existsByUserId(Long userId);

    List<Trainer> findByActiveTrue();

    List<Trainer> findByActiveTrueAndAvailableTrue();

    List<Trainer> findBySpecializationContainingIgnoreCaseAndActiveTrueAndAvailableTrue(
            String specialization);

    Optional<Trainer> findByIdAndActiveTrue(Long id);
}
