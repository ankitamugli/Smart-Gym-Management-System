
package com.smartgym.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.ChatHistory;

@Repository
public interface ChatHistoryRepository
        extends JpaRepository<ChatHistory, Long> {

    List<ChatHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<ChatHistory> findByIdAndUserId(Long id, Long userId);
}
