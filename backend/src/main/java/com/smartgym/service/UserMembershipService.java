
package com.smartgym.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartgym.dto.MembershipResponse;
import com.smartgym.dto.SubscribeRequest;
import com.smartgym.entity.MembershipPlan;
import com.smartgym.entity.User;
import com.smartgym.entity.UserMembership;
import com.smartgym.repository.UserMembershipRepository;
import com.smartgym.repository.UserRepository;

@Service
public class UserMembershipService {

    @Autowired
    private UserMembershipRepository membershipRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MembershipPlanService planService;

    @Transactional
    public MembershipResponse subscribe(SubscribeRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        MembershipPlan plan = planService.getPlanById(request.getPlanId());

        if (!Boolean.TRUE.equals(plan.getActive())) {
            throw new RuntimeException("This plan is not available");
        }

        refreshStatus(user.getId());

        if (membershipRepository
                .findFirstByUserIdAndStatus(user.getId(), "ACTIVE")
                .isPresent()) {
            throw new RuntimeException(
                    "User already has an active membership");
        }

        LocalDate start = LocalDate.now();

        UserMembership membership = new UserMembership();
        membership.setUser(user);
        membership.setPlan(plan);
        membership.setStartDate(start);
        membership.setExpiryDate(
                start.plusMonths(plan.getDurationInMonths()));
        membership.setAutoRenew(
                Boolean.TRUE.equals(request.getAutoRenew()));
        membership.setStatus("ACTIVE");

        return toResponse(membershipRepository.save(membership));
    }

    @Transactional
    public MembershipResponse getCurrentMembership(Long userId) {

        refreshStatus(userId);

        UserMembership membership = membershipRepository
                .findFirstByUserIdAndStatus(userId, "ACTIVE")
                .orElseThrow(() ->
                        new RuntimeException(
                                "No active membership found for user id: "
                                        + userId));

        return toResponse(membership);
    }

    @Transactional
    public List<MembershipResponse> getHistory(Long userId) {

        refreshStatus(userId);

        return membershipRepository
                .findByUserIdOrderByStartDateDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MembershipResponse setAutoRenew(
            Long membershipId, Boolean autoRenew) {

        UserMembership membership = membershipRepository
                .findById(membershipId)
                .orElseThrow(() ->
                        new RuntimeException("Membership not found"));

        membership.setAutoRenew(Boolean.TRUE.equals(autoRenew));

        return toResponse(membershipRepository.save(membership));
    }

    @Transactional
    public int processExpiredMemberships() {

        List<UserMembership> expired =
                membershipRepository.findByStatusAndExpiryDateBefore(
                        "ACTIVE", LocalDate.now());

        int renewed = 0;

        for (UserMembership membership : expired) {

            membership.setStatus("EXPIRED");
            membershipRepository.save(membership);

            MembershipPlan plan = membership.getPlan();

            if (Boolean.TRUE.equals(membership.getAutoRenew())
                    && Boolean.TRUE.equals(plan.getActive())) {

                // Do not create another active membership
                boolean alreadyActive = membershipRepository
                        .findFirstByUserIdAndStatus(
                                membership.getUser().getId(),
                                "ACTIVE")
                        .isPresent();

                if (!alreadyActive) {

                    LocalDate start = LocalDate.now();

                    UserMembership next = new UserMembership();
                    next.setUser(membership.getUser());
                    next.setPlan(plan);
                    next.setStartDate(start);
                    next.setExpiryDate(
                            start.plusMonths(plan.getDurationInMonths()));
                    next.setAutoRenew(true);
                    next.setStatus("ACTIVE");

                    membershipRepository.save(next);
                    renewed++;
                }
            }
        }

        return renewed;
    }

    @Transactional
    private void refreshStatus(Long userId) {

        List<UserMembership> memberships =
                membershipRepository
                        .findByUserIdOrderByStartDateDesc(userId);

        LocalDate today = LocalDate.now();

        for (UserMembership membership : memberships) {

            if ("ACTIVE".equals(membership.getStatus())
                    && membership.getExpiryDate() != null
                    && membership.getExpiryDate().isBefore(today)) {

                membership.setStatus("EXPIRED");
                membershipRepository.save(membership);
            }
        }
    }

    private MembershipResponse toResponse(UserMembership membership) {

        long daysLeft = Math.max(
                0,
                ChronoUnit.DAYS.between(
                        LocalDate.now(),
                        membership.getExpiryDate()));

        return new MembershipResponse(
                membership.getId(),
                membership.getUser().getId(),
                membership.getUser().getFullName(),
                membership.getPlan().getName(),
                membership.getPlan().getPrice(),
                membership.getStartDate(),
                membership.getExpiryDate(),
                daysLeft,
                membership.getAutoRenew(),
                membership.getStatus()
        );
    }
}
