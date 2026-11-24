
package com.smartgym.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.ChallengeParticipation;

@Repository
public interface ChallengeParticipationRepository
        extends JpaRepository<ChallengeParticipation, Long> {

    boolean existsByChallengeIdAndUserId(
            Long challengeId, Long userId);

    Optional<ChallengeParticipation> findByChallengeIdAndUserId(
            Long challengeId, Long userId);

    List<ChallengeParticipation> findByUserIdOrderByJoinedAtDesc(
            Long userId);

    List<ChallengeParticipation>
        findByChallengeIdOrderByProgressValueDescRewardPointsEarnedDesc(
            Long challengeId);
}
