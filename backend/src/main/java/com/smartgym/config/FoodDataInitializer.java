
package com.smartgym.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.smartgym.entity.Food;
import com.smartgym.repository.FoodRepository;

@Configuration
public class FoodDataInitializer {

    @Bean
    CommandLineRunner loadFoodData(FoodRepository repository) {
        return args -> {

            List<Food> foods = List.of(
                new Food("f01", "Apple", "1 medium", 95, 0.5, 25, 0.3),
                new Food("f02", "Banana", "1 medium", 105, 1.3, 27, 0.4),
                new Food("f03", "Orange", "1 medium", 62, 1.2, 15, 0.2),
                new Food("f04", "Mango", "1 cup", 99, 1.4, 25, 0.6),
                new Food("f05", "Oats", "100 g", 389, 16.9, 66.3, 6.9),
                new Food("f06", "Rice", "100 g cooked", 130, 2.7, 28, 0.3),
                new Food("f07", "Roti", "1 medium", 110, 3, 22, 1.5),
                new Food("f08", "Bread", "2 slices", 160, 6, 30, 2),
                new Food("f09", "Egg", "1 large", 72, 6.3, 0.4, 4.8),
                new Food("f10", "Milk", "1 cup", 122, 8, 12, 5),
                new Food("f11", "Curd", "100 g", 98, 11, 3.4, 4.3),
                new Food("f12", "Paneer", "100 g", 265, 18, 3.6, 20),
                new Food("f13", "Chicken Breast", "100 g", 165, 31, 0, 3.6),
                new Food("f14", "Fish", "100 g", 128, 26, 0, 2.7),
                new Food("f15", "Almonds", "10 pieces", 70, 2.6, 2.5, 6),
                new Food("f16", "Peanuts", "30 g", 170, 7, 6, 14),
                new Food("f17", "Walnuts", "30 g", 196, 4.6, 4.1, 19.6),
                new Food("f18", "Dal", "1 cup cooked", 198, 12, 34, 0.8),
                new Food("f19", "Chickpeas", "100 g cooked", 164, 8.9, 27.4, 2.6),
                new Food("f20", "Rajma", "100 g cooked", 127, 8.7, 22.8, 0.5),
                new Food("f21", "Broccoli", "100 g", 34, 2.8, 6.6, 0.4),
                new Food("f22", "Carrot", "1 medium", 25, 0.6, 6, 0.1),
                new Food("f23", "Potato", "100 g", 87, 1.9, 20.1, 0.1),
                new Food("f24", "Sweet Potato", "100 g", 86, 1.6, 20.1, 0.1),
                new Food("f25", "Tomato", "1 medium", 22, 1.1, 4.8, 0.2),
                new Food("f26", "Cucumber", "100 g", 15, 0.7, 3.6, 0.1),
                new Food("f27", "Spinach", "100 g", 23, 2.9, 3.6, 0.4),
                new Food("f28", "Peas", "100 g", 81, 5.4, 14.5, 0.4),
                new Food("f29", "Quinoa", "100 g cooked", 120, 4.4, 21.3, 1.9),
                new Food("f30", "Peanut Butter", "2 tbsp", 188, 8, 6, 16),
                new Food("f31", "Protein Shake", "1 scoop", 120, 24, 3, 1.5),
                new Food("f32", "Green Tea", "1 cup", 2, 0, 0, 0)
            );

            for (Food food : foods) {
                if (!repository.existsById(food.getId())) {
                    repository.save(food);
                }
            }

            System.out.println("Food data initialization completed!");
        };
    }
}
