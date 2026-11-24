package com.smartgym.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartgym.entity.PostureAnalysis;

public interface PostureRepository  extends JpaRepository<PostureAnalysis, Long>  {
    List<PostureAnalysis> findByUserIdOrderByCreatedAtDesc(Long userId);


}
