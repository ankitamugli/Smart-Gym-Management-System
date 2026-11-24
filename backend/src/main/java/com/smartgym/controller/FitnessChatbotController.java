
package com.smartgym.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.smartgym.dto.ChatRequest;
import com.smartgym.dto.ChatResponse;
import com.smartgym.response.ApiResponse;
import com.smartgym.service.FitnessChatbotService;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class FitnessChatbotController {

    private final FitnessChatbotService chatbotService;

    public FitnessChatbotController(FitnessChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    // 1. Send message to chatbot
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @RequestBody ChatRequest request) {

        ChatResponse response = chatbotService.chat(request);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Chat response generated successfully",
                        response
                )
        );
    }

    // 2. Get all chat history of a user
    @GetMapping("/user/{userId}/history")
    public ResponseEntity<ApiResponse<List<ChatResponse>>> getChatHistory(
            @PathVariable Long userId) {

        List<ChatResponse> history =
                chatbotService.getChatHistory(userId);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Chat history fetched successfully",
                        history
                )
        );
    }

    // 3. Get a particular chat by ID
    @GetMapping("/user/{userId}/history/{chatId}")
    public ResponseEntity<ApiResponse<ChatResponse>> getChatById(
            @PathVariable Long userId,
            @PathVariable Long chatId) {

        ChatResponse response =
                chatbotService.getChatById(userId, chatId);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Chat fetched successfully",
                        response
                )
        );
    }

    // 4. Delete a particular chat
    @DeleteMapping("/user/{userId}/history/{chatId}")
    public ResponseEntity<ApiResponse<String>> deleteChat(
            @PathVariable Long userId,
            @PathVariable Long chatId) {

        String result = chatbotService.deleteChat(userId, chatId);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Chat deleted successfully",
                        result
                )
        );
    }
}
