package com.smartgym.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.UserMembership;

@Repository
public interface UserMembershipRepository extends JpaRepository<UserMembership, Long> {

    Optional<UserMembership> findFirstByUserIdAndStatus(Long userId, String status);

    List<UserMembership> findByUserIdOrderByStartDateDesc(Long userId);

    List<UserMembership> findByStatusAndExpiryDateBefore(String status, LocalDate date);
}