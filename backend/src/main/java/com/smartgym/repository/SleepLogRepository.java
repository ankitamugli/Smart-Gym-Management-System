package com.smartgym.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.SleepLog;

@Repository
public interface SleepLogRepository  extends JpaRepository<SleepLog, Long> {
	

    Optional<SleepLog> findByUserIdAndSleepDate(Long userId, LocalDate sleepDate);

    List<SleepLog> findByUserIdOrderBySleepDateDesc(Long userId);

}
