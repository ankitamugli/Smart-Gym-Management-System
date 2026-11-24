
package com.smartgym.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.smartgym.dto.ChatRequest;
import com.smartgym.dto.ChatResponse;
import com.smartgym.entity.ChatHistory;
import com.smartgym.repository.ChatHistoryRepository;

@Service
public class FitnessChatbotService {

    private final ChatHistoryRepository chatRepository;

    public FitnessChatbotService(ChatHistoryRepository chatRepository) {
        this.chatRepository = chatRepository;
    }

    public ChatResponse chat(ChatRequest request) {

        if (request.getUserId() == null || request.getUserId() <= 0) {
            throw new RuntimeException("Valid userId is required");
        }

        if (request.getMessage() == null
                || request.getMessage().trim().isEmpty()) {
            throw new RuntimeException("Message cannot be empty");
        }

        if (request.getMessage().length() > 1000) {
            throw new RuntimeException("Message cannot exceed 1000 characters");
        }

        String message = request.getMessage().trim();
        String lowerMessage = message.toLowerCase(Locale.ROOT);

        String category;
        String answer;

        if (containsAny(lowerMessage, "hello", "hi", "hey", "good morning")) {
            category = "GREETING";
            answer = "Hello! Welcome to Smart Gym Fitness Assistant. "
                    + "I can help you with workouts, diet, calories, "
                    + "weight loss, muscle gain and recovery. What would you like to know?";
        }
        else if (containsAny(lowerMessage, "weight loss", "lose weight",
                "fat loss", "belly fat")) {
            category = "WEIGHT_LOSS";
            answer = "For healthy weight loss, combine regular exercise "
                    + "with balanced meals and consistent sleep. "
                    + "Try walking, strength training and moderate cardio. "
                    + "Avoid crash diets and aim for gradual progress.";
        }
        else if (containsAny(lowerMessage, "muscle gain", "build muscle",
                "muscles", "body building")) {
            category = "MUSCLE_GAIN";
            answer = "For muscle growth, follow progressive strength training, "
                    + "eat enough calories and include protein-rich foods such as "
                    + "dal, eggs, paneer, milk, beans or tofu. "
                    + "Allow your muscles time to recover between sessions.";
        }
        else if (containsAny(lowerMessage, "workout", "exercise",
                "gym routine", "training")) {
            category = "WORKOUT";
            answer = "A beginner-friendly routine can include squats, "
                    + "wall push-ups, lunges, light rows and walking. "
                    + "Start with manageable sets, warm up first and increase "
                    + "difficulty gradually. Choose exercises suitable for your fitness level.";
        }
        else if (containsAny(lowerMessage, "diet", "nutrition",
                "food", "meal", "protein")) {
            category = "NUTRITION";
            answer = "Build balanced meals with vegetables, fruits, "
                    + "whole grains and protein sources such as dal, beans, "
                    + "eggs, paneer, tofu or curd. Drink enough water "
                    + "and adjust portions to your personal energy needs.";
        }
        else if (containsAny(lowerMessage, "calorie", "calories",
                "calorie deficit")) {
            category = "CALORIES";
            answer = "Calories measure the energy you get from food. "
                    + "Your daily needs depend on age, body size, activity "
                    + "and goals. Track meals consistently and avoid extreme "
                    + "calorie restriction.";
        }
        else if (containsAny(lowerMessage, "sleep", "recovery",
                "rest", "tired")) {
            category = "SLEEP_RECOVERY";
            answer = "Good recovery supports fitness progress. "
                    + "Keep a consistent sleep schedule, allow rest between "
                    + "hard training sessions and take lighter days when needed. "
                    + "Many adults benefit from 7 to 9 hours of sleep.";
        }
        else if (containsAny(lowerMessage, "membership", "subscription",
                "gym plan", "fees")) {
            category = "MEMBERSHIP";
            answer = "You can check available gym membership plans in the "
                    + "Smart Gym application. Compare the plan duration, "
                    + "price and included facilities before subscribing.";
        }
        else if (containsAny(lowerMessage, "injury", "pain",
                "hurt", "swelling")) {
            category = "INJURY_SAFETY";
            answer = "Stop any exercise that causes pain. Do not try to train "
                    + "through an injury. Seek advice from a qualified healthcare "
                    + "professional, especially for severe, persistent or worsening symptoms.";
        }
        else if (containsAny(lowerMessage, "thank you", "thanks")) {
            category = "GENERAL";
            answer = "You're welcome! Keep building healthy habits. "
                    + "Consistency is more important than perfection.";
        }
        else {
            category = "GENERAL";
            answer = "I'm your Smart Gym Fitness Assistant. I can help with "
                    + "workouts, weight loss, muscle gain, nutrition, calories "
                    + "and sleep recovery. Please ask me a fitness-related question.";
        }

        ChatHistory history = new ChatHistory();
        history.setUserId(request.getUserId());
        history.setMessage(message);
        history.setResponse(answer);
        history.setCategory(category);

        ChatHistory saved = chatRepository.save(history);

        return convertToResponse(saved);
    }

    public List<ChatResponse> getChatHistory(Long userId) {

        if (userId == null || userId <= 0) {
            throw new RuntimeException("Valid userId is required");
        }

        return chatRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public ChatResponse getChatById(Long userId, Long chatId) {

        ChatHistory history = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> new RuntimeException("Chat history not found"));

        return convertToResponse(history);
    }

    public String deleteChat(Long userId, Long chatId) {

        ChatHistory history = chatRepository.findByIdAndUserId(chatId, userId)
                .orElseThrow(() -> new RuntimeException("Chat history not found"));

        chatRepository.delete(history);

        return "Chat history deleted successfully";
    }

    private boolean containsAny(String message, String... keywords) {
        for (String keyword : keywords) {
            if (message.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private ChatResponse convertToResponse(ChatHistory history) {

        return new ChatResponse(
                history.getId(),
                history.getUserId(),
                history.getMessage(),
                history.getResponse(),
                history.getCategory(),
                history.getCreatedAt()
        );
    }
}
