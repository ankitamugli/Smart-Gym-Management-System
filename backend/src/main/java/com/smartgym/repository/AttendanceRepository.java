package com.smartgym.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.Attendance;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findFirstByUserIdAndCheckOutTimeIsNull(Long userId);

    List<Attendance> findByUserIdOrderByCheckInTimeDesc(Long userId);
}