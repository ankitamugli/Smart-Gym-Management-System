
package com.smartgym.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartgym.dto.*;
import com.smartgym.entity.*;
import com.smartgym.repository.*;

@Service
public class FitnessChallengeService {

    @Autowired
    private FitnessChallengeRepository challengeRepository;

    @Autowired
    private ChallengeParticipationRepository participationRepository;

    @Autowired
    private UserRepository userRepository;

    // CREATE CHALLENGE
    public ChallengeResponse createChallenge(ChallengeRequest request) {

        validateChallenge(request);

        FitnessChallenge challenge = new FitnessChallenge();

        copyRequestToEntity(request, challenge);

        challenge.setActive(true);

        return toChallengeResponse(
                challengeRepository.save(challenge));
    }

    // GET ALL CHALLENGES
    public List<ChallengeResponse> getAllChallenges() {

        return challengeRepository.findAll()
                .stream()
                .map(this::toChallengeResponse)
                .toList();
    }

    // GET ACTIVE CHALLENGES
    public List<ChallengeResponse> getActiveChallenges() {

        return challengeRepository.findByActiveTrue()
                .stream()
                .map(this::toChallengeResponse)
                .toList();
    }

    // GET CHALLENGE BY ID
    public ChallengeResponse getChallenge(Long id) {

        FitnessChallenge challenge = findChallenge(id);

        return toChallengeResponse(challenge);
    }

    // UPDATE CHALLENGE
    public ChallengeResponse updateChallenge(
            Long id, ChallengeRequest request) {

        validateChallenge(request);

        FitnessChallenge challenge = findChallenge(id);

        if (!participationRepository
                .findByChallengeIdOrderByProgressValueDescRewardPointsEarnedDesc(id)
                .isEmpty()) {
            throw new RuntimeException(
                    "Cannot update challenge after members have joined");
        }

        copyRequestToEntity(request, challenge);

        return toChallengeResponse(
                challengeRepository.save(challenge));
    }

    // DELETE CHALLENGE (SOFT DELETE)
    public String deleteChallenge(Long id) {

        FitnessChallenge challenge = findChallenge(id);

        challenge.setActive(false);

        challengeRepository.save(challenge);

        return "Challenge deactivated successfully";
    }

    // JOIN CHALLENGE
    public ParticipationResponse joinChallenge(
            JoinChallengeRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        FitnessChallenge challenge =
                findChallenge(request.getChallengeId());

        if (!Boolean.TRUE.equals(challenge.getActive())) {
            throw new RuntimeException("Challenge is not active");
        }

        LocalDate today = LocalDate.now();

        if (today.isBefore(challenge.getStartDate())
                || today.isAfter(challenge.getEndDate())) {
            throw new RuntimeException(
                    "Challenge is not currently open");
        }

        if (participationRepository.existsByChallengeIdAndUserId(
                challenge.getId(), user.getId())) {
            throw new RuntimeException(
                    "User already joined this challenge");
        }

        ChallengeParticipation participation =
                new ChallengeParticipation();

        participation.setUser(user);
        participation.setChallenge(challenge);
        participation.setProgressValue(0);
        participation.setRewardPointsEarned(0);
        participation.setStatus("JOINED");

        return toParticipationResponse(
                participationRepository.save(participation));
    }

    // UPDATE PROGRESS
    @Transactional
    public ParticipationResponse updateProgress(
            Long participationId, ProgressRequest request) {

        if (request.getProgressValue() == null
                || request.getProgressValue() < 0) {
            throw new RuntimeException(
                    "Progress value must be zero or greater");
        }

        ChallengeParticipation participation =
                participationRepository.findById(participationId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Challenge participation not found"));

        FitnessChallenge challenge = participation.getChallenge();

        if ("COMPLETED".equals(participation.getStatus())) {
            throw new RuntimeException(
                    "Challenge is already completed");
        }

        LocalDate today = LocalDate.now();

        if (!Boolean.TRUE.equals(challenge.getActive())
                || today.isBefore(challenge.getStartDate())
                || today.isAfter(challenge.getEndDate())) {
            throw new RuntimeException(
                    "Challenge is not currently active");
        }

        if (request.getProgressValue()
                < participation.getProgressValue()) {
            throw new RuntimeException(
                    "Progress cannot be decreased");
        }

        if (request.getProgressValue()
                > challenge.getTargetValue()) {
            throw new RuntimeException(
                    "Progress cannot exceed challenge target");
        }

        participation.setProgressValue(request.getProgressValue());

        if (request.getProgressValue()
                .equals(challenge.getTargetValue())) {

            participation.setStatus("COMPLETED");

            participation.setRewardPointsEarned(
                    challenge.getRewardPoints());

            participation.setCompletedAt(LocalDateTime.now());
        }

        return toParticipationResponse(
                participationRepository.save(participation));
    }

    // GET USER CHALLENGES
    public List<ParticipationResponse> getUserChallenges(
            Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }

        return participationRepository
                .findByUserIdOrderByJoinedAtDesc(userId)
                .stream()
                .map(this::toParticipationResponse)
                .toList();
    }

    // LEADERBOARD
    public List<LeaderboardResponse> getLeaderboard(
            Long challengeId) {

        findChallenge(challengeId);

        List<ChallengeParticipation> participants =
                participationRepository
                .findByChallengeIdOrderByProgressValueDescRewardPointsEarnedDesc(
                        challengeId);

        return java.util.stream.IntStream.range(0, participants.size())
                .mapToObj(index -> {

                    ChallengeParticipation p = participants.get(index);

                    return new LeaderboardResponse(
                            index + 1,
                            p.getUser().getId(),
                            p.getUser().getFullName(),
                            p.getProgressValue(),
                            p.getRewardPointsEarned(),
                            p.getStatus()
                    );
                })
                .toList();
    }

    // HELPER METHODS
    private FitnessChallenge findChallenge(Long id) {

        return challengeRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Challenge not found"));
    }

    private void validateChallenge(ChallengeRequest request) {

        if (request.getTitle() == null
                || request.getTitle().isBlank()) {
            throw new RuntimeException("Challenge title is required");
        }

        if (request.getChallengeType() == null
                || request.getChallengeType().isBlank()) {
            throw new RuntimeException("Challenge type is required");
        }

        if (request.getTargetValue() == null
                || request.getTargetValue() <= 0) {
            throw new RuntimeException(
                    "Target value must be greater than zero");
        }

        if (request.getDurationInDays() == null
                || request.getDurationInDays() <= 0) {
            throw new RuntimeException(
                    "Duration must be greater than zero");
        }

        if (request.getRewardPoints() == null
                || request.getRewardPoints() < 0) {
            throw new RuntimeException(
                    "Reward points cannot be negative");
        }

        if (request.getStartDate() == null
                || request.getEndDate() == null
                || request.getEndDate().isBefore(request.getStartDate())) {
            throw new RuntimeException("Invalid challenge dates");
        }
    }

    private void copyRequestToEntity(
            ChallengeRequest request, FitnessChallenge challenge) {

        challenge.setTitle(request.getTitle());
        challenge.setDescription(request.getDescription());
        challenge.setChallengeType(request.getChallengeType());
        challenge.setTargetValue(request.getTargetValue());
        challenge.setDurationInDays(request.getDurationInDays());
        challenge.setRewardPoints(request.getRewardPoints());
        challenge.setStartDate(request.getStartDate());
        challenge.setEndDate(request.getEndDate());
    }

    private ChallengeResponse toChallengeResponse(
            FitnessChallenge c) {

        return new ChallengeResponse(
                c.getId(),
                c.getTitle(),
                c.getDescription(),
                c.getChallengeType(),
                c.getTargetValue(),
                c.getDurationInDays(),
                c.getRewardPoints(),
                c.getStartDate(),
                c.getEndDate(),
                c.getActive()
        );
    }

    private ParticipationResponse toParticipationResponse(
            ChallengeParticipation p) {

        return new ParticipationResponse(
                p.getId(),
                p.getUser().getId(),
                p.getUser().getFullName(),
                p.getChallenge().getId(),
                p.getChallenge().getTitle(),
                p.getChallenge().getTargetValue(),
                p.getProgressValue(),
                p.getRewardPointsEarned(),
                p.getStatus(),
                p.getJoinedAt(),
                p.getCompletedAt()
        );
    }
}
