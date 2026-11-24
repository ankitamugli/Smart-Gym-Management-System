
package com.smartgym.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.TrainerBooking;

@Repository
public interface TrainerBookingRepository
        extends JpaRepository<TrainerBooking, Long> {

    List<TrainerBooking> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    List<TrainerBooking> findByTrainerIdOrderByCreatedAtDesc(Long trainerId);

    boolean existsByTrainerIdAndScheduledAtAndStatusIn(
            Long trainerId,
            java.time.LocalDateTime scheduledAt,
            List<String> statuses);
}
