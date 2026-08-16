package com.nourish.tracker;

import com.nourish.tracker.config.RenderDatabaseEnvironment;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CalorieTrackerApplication {

	public static void main(String[] args) {
		RenderDatabaseEnvironment.configure();
		SpringApplication.run(CalorieTrackerApplication.class, args);
	}

}
