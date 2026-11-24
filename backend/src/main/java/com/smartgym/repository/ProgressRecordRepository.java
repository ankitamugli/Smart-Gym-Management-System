package com.smartgym.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartgym.entity.ProgressRecord;

public interface ProgressRecordRepository extends JpaRepository<ProgressRecord, Long> {

    List<ProgressRecord> findByUserIdAndKindOrderByCreatedAtDesc(Long userId, String kind);
}