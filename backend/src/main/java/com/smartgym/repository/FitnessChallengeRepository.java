
package com.smartgym.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.FitnessChallenge;

@Repository
public interface FitnessChallengeRepository
        extends JpaRepository<FitnessChallenge, Long> {

    List<FitnessChallenge> findByActiveTrue();
}
