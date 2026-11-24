package com.smartgym;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling

public class SmartGymApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartGymApplication.class, args);
	}

}
