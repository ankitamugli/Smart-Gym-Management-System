package com.smartgym.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.smartgym.service.UserMembershipService;

@Component
public class MembershipScheduler {

    private final UserMembershipService membershipService;

    public MembershipScheduler(UserMembershipService membershipService) {
        this.membershipService = membershipService;
    }

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void renewExpiredMemberships() {

        System.out.println("Checking expired memberships...");

        membershipService.processExpiredMemberships();

        System.out.println("Membership renewal process completed.");
    }
}