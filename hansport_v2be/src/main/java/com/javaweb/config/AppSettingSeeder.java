package com.javaweb.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.domain.AppSetting;
import com.javaweb.domain.SiteBanner;
import com.javaweb.domain.SiteCategory;
import com.javaweb.domain.SiteNavigationItem;
import com.javaweb.repository.AppSettingRepository;
import com.javaweb.repository.SiteBannerRepository;
import com.javaweb.repository.SiteCategoryRepository;
import com.javaweb.repository.SiteNavigationItemRepository;
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
    private final SiteBannerRepository siteBannerRepository;
    private final SiteCategoryRepository siteCategoryRepository;
    private final SiteNavigationItemRepository siteNavigationItemRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.seed.settings.enabled:true}")
    private boolean settingsSeedEnabled;

    public AppSettingSeeder(
            AppSettingRepository appSettingRepository,
            SiteBannerRepository siteBannerRepository,
            SiteCategoryRepository siteCategoryRepository,
            SiteNavigationItemRepository siteNavigationItemRepository,
            ObjectMapper objectMapper) {
        this.appSettingRepository = appSettingRepository;
        this.siteBannerRepository = siteBannerRepository;
        this.siteCategoryRepository = siteCategoryRepository;
        this.siteNavigationItemRepository = siteNavigationItemRepository;
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
        seededCount += saveIfMissing("HEADER_NAV", objectMapper.writeValueAsString(defaultHeaderNav()));
        seededCount += saveIfMissing("BRANDS", "[\"Yonex\", \"Victor\", \"Lining\", \"Kawasaki\", \"Mizuno\", \"Apacs\", \"Flypower\", \"Kumpoo\", \"Khác\"]");
        seededCount += saveIfMissing("TARGETS", "[\"Nam\", \"Nữ\", \"Unisex\", \"Trẻ em\"]");
        seededCount += saveIfMissing("HOTLINE", "090 123 4567");
        seededCount += saveIfMissing("SHIPPING_FEE", "30000");
        seededCount += saveIfMissing("FREE_SHIP_LIMIT", "500000");
        seededCount += seedBannersIfMissing();
        seededCount += seedCategoriesIfMissing();
        seededCount += seedNavigationIfMissing();

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

    private int seedBannersIfMissing() throws JsonProcessingException {
        if (siteBannerRepository.count() > 0) {
            return 0;
        }
        List<SiteBanner> banners = new ArrayList<>();
        JsonNode source = settingJsonArray("HERO_SLIDES", objectMapper.writeValueAsString(defaultHeroSlides()));
        int index = 0;
        for (JsonNode item : source) {
            String title = textField(item, "title");
            if (title.isBlank()) {
                continue;
            }
            SiteBanner banner = new SiteBanner();
            banner.setTitle(title);
            banner.setSubtitle(blankToNull(textField(item, "subtitle")));
            banner.setCta(blankToNull(textField(item, "cta")));
            banner.setCtaLink(blankToNull(textField(item, "ctaLink")));
            banner.setImage(blankToNull(textField(item, "image")));
            banner.setImageFolder(blankToNull(textField(item, "imageFolder")));
            banner.setAltText(blankToNull(textField(item, "altText")));
            banner.setBg(blankToNull(textField(item, "bg")));
            banner.setActive(booleanField(item, "active", true));
            banner.setSortOrder(index++);
            banners.add(banner);
        }
        siteBannerRepository.saveAll(banners);
        return banners.size();
    }

    private int seedCategoriesIfMissing() throws JsonProcessingException {
        if (siteCategoryRepository.count() > 0) {
            return 0;
        }
        List<SiteCategory> categories = new ArrayList<>();
        JsonNode source = settingJsonArray("CATEGORIES", objectMapper.writeValueAsString(defaultCategories()));
        int index = 0;
        for (JsonNode item : source) {
            String name = textField(item, "name");
            String path = textField(item, "path");
            if (name.isBlank() || path.isBlank()) {
                continue;
            }
            SiteCategory category = new SiteCategory();
            category.setName(name);
            category.setIcon(defaultIfBlank(textField(item, "icon"), "category"));
            category.setPath(path);
            category.setColor(defaultIfBlank(textField(item, "color"), "bg-surface-muted text-text-primary"));
            category.setActive(booleanField(item, "active", true));
            category.setSortOrder(index++);
            categories.add(category);
        }
        siteCategoryRepository.saveAll(categories);
        return categories.size();
    }

    private int seedNavigationIfMissing() throws JsonProcessingException {
        if (siteNavigationItemRepository.count() > 0) {
            return 0;
        }
        List<SiteNavigationItem> items = new ArrayList<>();
        JsonNode source = settingJsonArray("HEADER_NAV", objectMapper.writeValueAsString(defaultHeaderNav()));
        int index = 0;
        for (JsonNode item : source) {
            String label = textField(item, "label");
            String path = textField(item, "path");
            if (label.isBlank() || path.isBlank()) {
                continue;
            }
            SiteNavigationItem nav = new SiteNavigationItem();
            nav.setLabel(label);
            nav.setPath(path);
            nav.setActive(booleanField(item, "active", true));
            nav.setSortOrder(index++);
            items.add(nav);
        }
        siteNavigationItemRepository.saveAll(items);
        return items.size();
    }

    private JsonNode settingJsonArray(String key, String fallback) throws JsonProcessingException {
        String value = appSettingRepository.findBySettingKey(key)
                .map(AppSetting::getSettingValue)
                .filter(current -> current != null && !current.isBlank())
                .orElse(fallback);
        try {
            JsonNode node = objectMapper.readTree(value);
            return node.isArray() ? node : objectMapper.readTree(fallback);
        } catch (JsonProcessingException ex) {
            return objectMapper.readTree(fallback);
        }
    }

    private String textField(JsonNode item, String field) {
        JsonNode value = item.get(field);
        return value == null || value.isNull() ? "" : value.asText("").trim();
    }

    private boolean booleanField(JsonNode item, String field, boolean defaultValue) {
        JsonNode value = item.get(field);
        return value == null || value.isNull() ? defaultValue : value.asBoolean(defaultValue);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<Map<String, Object>> defaultHeroSlides() {
        List<Map<String, Object>> slides = new ArrayList<>();
        slides.add(createSlide(
                "Yonex Astrox 99 Pro chính hãng",
                "Vợt tấn công mạnh mẽ cho người chơi cầu lông hiện đại",
                "Mua ngay",
                "/shop?q=Yonex",
                "from-[#0f2027] via-[#1d4ed8] to-[#0d9488]",
                "Banner Yonex Astrox 99 Pro"
        ));
        slides.add(createSlide(
                "Giày cầu lông Victor",
                "Êm chân, bám sân tốt và bền bỉ cho luyện tập hằng ngày",
                "Xem bộ sưu tập",
                "/shop?category=Giày",
                "from-[#0f2027] via-[#16a34a] to-[#0d9488]",
                "Banner giày cầu lông Victor"
        ));
        return slides;
    }

    private Map<String, Object> createSlide(String title, String subtitle, String cta, String ctaLink, String bg, String altText) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("title", title);
        map.put("subtitle", subtitle);
        map.put("cta", cta);
        map.put("ctaLink", ctaLink);
        map.put("bg", bg);
        map.put("altText", altText);
        map.put("active", true);
        return map;
    }

    private List<Map<String, Object>> defaultCategories() {
        List<Map<String, Object>> categories = new ArrayList<>();
        categories.add(createCat("Vợt cầu lông", "sports_tennis", "/shop?category=Vợt cầu lông", "bg-brand-blue-light text-brand-blue"));
        categories.add(createCat("Giày", "footprint", "/shop?category=Giày", "bg-brand-green-light text-brand-green"));
        categories.add(createCat("Áo thể thao", "dry_cleaning", "/shop?category=Áo thể thao", "bg-brand-teal-light text-brand-teal"));
        categories.add(createCat("Balo", "backpack", "/shop?category=Balo", "bg-blue-50 text-blue-600"));
        categories.add(createCat("Túi sách", "category", "/shop?category=Túi sách", "bg-green-50 text-green-600"));
        categories.add(createCat("Khuyến mãi", "local_fire_department", "/shop?sale=true", "bg-red-50 text-danger"));
        return categories;
    }

    private Map<String, Object> createCat(String name, String icon, String path, String color) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("name", name);
        map.put("icon", icon);
        map.put("path", path);
        map.put("color", color);
        map.put("active", true);
        return map;
    }

    private List<Map<String, Object>> defaultHeaderNav() {
        List<Map<String, Object>> items = new ArrayList<>();
        items.add(createNav("Trang chủ", "/"));
        items.add(createNav("Cửa hàng", "/shop"));
        items.add(createNav("Khuyến mãi", "/shop?sale=true"));
        items.add(createNav("Đơn hàng", "/orders"));
        return items;
    }

    private Map<String, Object> createNav(String label, String path) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("label", label);
        map.put("path", path);
        map.put("active", true);
        return map;
    }
}
