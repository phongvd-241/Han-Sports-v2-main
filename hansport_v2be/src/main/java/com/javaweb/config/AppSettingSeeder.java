package com.javaweb.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.domain.AppSetting;
import com.javaweb.repository.AppSettingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class AppSettingSeeder implements CommandLineRunner {

    private final AppSettingRepository appSettingRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.seed.settings.enabled:true}")
    private boolean settingsSeedEnabled;

    public AppSettingSeeder(AppSettingRepository appSettingRepository, ObjectMapper objectMapper) {
        this.appSettingRepository = appSettingRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws JsonProcessingException {
        if (!settingsSeedEnabled) {
            return;
        }

        int seededCount = 0;
        seededCount += saveIfMissing("HERO_SLIDES", objectMapper.writeValueAsString(defaultHeroSlides()));
        seededCount += saveIfMissing("CATEGORIES", objectMapper.writeValueAsString(defaultCategories()));
        seededCount += saveIfMissing("BRANDS", "[\"Yonex\", \"Victor\", \"Lining\", \"Kawasaki\", \"Mizuno\", \"Apacs\", \"Flypower\", \"Kumpoo\", \"Khac\"]");
        seededCount += saveIfMissing("TARGETS", "[\"Nam\", \"Nu\", \"Unisex\", \"Tre em\"]");
        seededCount += saveIfMissing("HOTLINE", "090 123 4567");
        seededCount += saveIfMissing("SHIPPING_FEE", "30000");
        seededCount += saveIfMissing("FREE_SHIP_LIMIT", "500000");

        if (seededCount > 0) {
            System.out.println(">>> SEEDED APP SETTINGS: " + seededCount);
        }
    }

    private int saveIfMissing(String key, String value) {
        if (appSettingRepository.findBySettingKey(key).isPresent()) {
            return 0;
        }

        AppSetting setting = new AppSetting();
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        appSettingRepository.save(setting);
        return 1;
    }

    private List<Map<String, String>> defaultHeroSlides() {
        List<Map<String, String>> slides = new ArrayList<>();
        slides.add(createSlide(
                "Yonex Astrox 99 Pro",
                "Power and control for badminton players",
                "Mua ngay",
                "/shop?q=Yonex",
                "from-[#0f2027] via-[#1d4ed8] to-[#0d9488]"
        ));
        slides.add(createSlide(
                "Victor indoor shoes",
                "Lightweight, durable and comfortable",
                "Xem bo suu tap",
                "/shop?category=Giay",
                "from-[#0f2027] via-[#16a34a] to-[#0d9488]"
        ));
        return slides;
    }

    private Map<String, String> createSlide(String title, String subtitle, String cta, String ctaLink, String bg) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("title", title);
        map.put("subtitle", subtitle);
        map.put("cta", cta);
        map.put("ctaLink", ctaLink);
        map.put("bg", bg);
        return map;
    }

    private List<Map<String, String>> defaultCategories() {
        List<Map<String, String>> categories = new ArrayList<>();
        categories.add(createCat("Vot cau long", "sports_tennis", "/shop?category=Vot cau long", "bg-brand-blue-light text-brand-blue"));
        categories.add(createCat("Giay", "footprint", "/shop?category=Giay", "bg-brand-green-light text-brand-green"));
        categories.add(createCat("Ao the thao", "dry_cleaning", "/shop?category=Ao the thao", "bg-brand-teal-light text-brand-teal"));
        categories.add(createCat("Balo", "backpack", "/shop?category=Balo", "bg-blue-50 text-blue-600"));
        categories.add(createCat("Tui sach", "category", "/shop?category=Tui sach", "bg-green-50 text-green-600"));
        categories.add(createCat("Khuyen mai", "local_fire_department", "/shop?sale=true", "bg-red-50 text-danger"));
        return categories;
    }

    private Map<String, String> createCat(String name, String icon, String path, String color) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("name", name);
        map.put("icon", icon);
        map.put("path", path);
        map.put("color", color);
        return map;
    }
}
