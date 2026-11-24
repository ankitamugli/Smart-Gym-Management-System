package com.smartgym.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smartgym.entity.MembershipPlan;
import com.smartgym.repository.MembershipPlanRepository;

@Service
public class MembershipPlanService {
	

    @Autowired
    private MembershipPlanRepository planRepository;

    public MembershipPlan createPlan(MembershipPlan plan) {
        if (planRepository.existsByName(plan.getName())) {
            throw new RuntimeException("Plan name already exists!");
        }
        return planRepository.save(plan);
    }

    public List<MembershipPlan> getAllActivePlans() {
        return planRepository.findByActiveTrue();
    }

    public MembershipPlan getPlanById(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + id));
    }

    public MembershipPlan updatePlan(Long id, MembershipPlan updated) {
        MembershipPlan plan = getPlanById(id);
        plan.setName(updated.getName());
        plan.setDurationInMonths(updated.getDurationInMonths());
        plan.setPrice(updated.getPrice());
        plan.setDescription(updated.getDescription());
        return planRepository.save(plan);
    }

    public void deactivatePlan(Long id) {
        MembershipPlan plan = getPlanById(id);
        plan.setActive(false);
        planRepository.save(plan);
    }
}
