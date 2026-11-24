package com.smartgym.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartgym.entity.MembershipPlan;

@Repository
public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long>{

	boolean existsByName(String name);

    List<MembershipPlan> findByActiveTrue();
}
