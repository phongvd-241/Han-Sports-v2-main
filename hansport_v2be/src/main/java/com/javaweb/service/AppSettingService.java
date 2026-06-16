package com.javaweb.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javaweb.domain.AppSetting;
import com.javaweb.domain.SiteBanner;
import com.javaweb.domain.SiteCategory;
import com.javaweb.domain.SiteNavigationItem;
import com.javaweb.domain.request.ReqSettingUpdateDTO;
import com.javaweb.domain.request.ReqSiteSettingsDTO;
import com.javaweb.repository.AppSettingRepository;
import com.javaweb.repository.SiteBannerRepository;
import com.javaweb.repository.SiteCategoryRepository;
import com.javaweb.repository.SiteNavigationItemRepository;
import com.javaweb.util.error.IdInvalidException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class AppSettingService {
    private static final Set<String> ALLOWED_SETTING_KEYS = Set.of(
            "HOTLINE",
            "SHIPPING_FEE",
            "FREE_SHIP_LIMIT",
            "BRANDS",
            "TARGETS",
            "HERO_SLIDES",
            "CATEGORIES",
            "HEADER_NAV"
    );

    private final AppSettingRepository appSettingRepository;
    private final SiteBannerRepository siteBannerRepository;
    private final SiteCategoryRepository siteCategoryRepository;
    private final SiteNavigationItemRepository siteNavigationItemRepository;
    private final ObjectMapper objectMapper;

    public AppSettingService(
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

    public Map<String, String> getAllSettings() {
        List<AppSetting> settings = appSettingRepository.findAll();
        Map<String, String> map = new HashMap<>();
        for (AppSetting s : settings) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        putSiteContent(map, false);
        return map;
    }

    public Map<String, String> getPublicSettings() {
        Map<String, String> settings = getAllSettings();
        putSiteContent(settings, true);
        return settings;
    }

    @Transactional
    public void updateBulkSettings(List<ReqSettingUpdateDTO> updates) throws IdInvalidException {
        if (updates == null || updates.isEmpty()) {
            throw new IdInvalidException("Settings update list must not be empty");
        }

        for (ReqSettingUpdateDTO dto : updates) {
            if (dto == null || dto.getSettingKey() == null) {
                throw new IdInvalidException("Setting key must not be blank");
            }
            String key = dto.getSettingKey().trim();
            String value = dto.getSettingValue();
            validateSetting(key, value);

            updateByKey(key, value);
        }
    }

    @Transactional
    public void updateSiteSettings(ReqSiteSettingsDTO settings) throws IdInvalidException {
        validateSiteSettings(settings);

        try {
            updateSetting("HOTLINE", settings.getHotline().trim());
            updateSetting("SHIPPING_FEE", String.valueOf(settings.getShippingFee()));
            updateSetting("FREE_SHIP_LIMIT", String.valueOf(settings.getFreeShipLimit()));
            updateSetting("BRANDS", objectMapper.writeValueAsString(cleanStringList(settings.getBrands())));
            updateSetting("TARGETS", objectMapper.writeValueAsString(cleanStringList(settings.getTargets())));
            updateSetting("HERO_SLIDES", objectMapper.writeValueAsString(settings.getHeroSlides()));
            updateSetting("CATEGORIES", objectMapper.writeValueAsString(settings.getCategories()));
            updateSetting("HEADER_NAV", objectMapper.writeValueAsString(settings.getHeaderNav()));
            replaceBanners(settings.getHeroSlides());
            replaceCategories(settings.getCategories());
            replaceNavigationItems(settings.getHeaderNav());
        } catch (JsonProcessingException ex) {
            throw new IdInvalidException("Settings payload must be valid JSON");
        }
    }

    private void updateByKey(String key, String value) throws IdInvalidException {
        switch (key) {
            case "HERO_SLIDES":
                replaceBanners(parseHeroSlides(value));
                updateSetting(key, value);
                break;
            case "CATEGORIES":
                replaceCategories(parseCategories(value));
                updateSetting(key, value);
                break;
            case "HEADER_NAV":
                replaceNavigationItems(parseNavigationItems(value));
                updateSetting(key, value);
                break;
            default:
                updateSetting(key, value);
        }
    }

    private void updateSetting(String key, String value) throws IdInvalidException {
        validateSetting(key, value);

        AppSetting setting = appSettingRepository.findBySettingKey(key).orElseGet(AppSetting::new);
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        appSettingRepository.save(setting);
    }

    private void replaceBanners(List<ReqSiteSettingsDTO.HeroSlideDTO> slides) {
        siteBannerRepository.deleteAll();
        List<SiteBanner> banners = new java.util.ArrayList<>();
        for (int i = 0; i < slides.size(); i++) {
            ReqSiteSettingsDTO.HeroSlideDTO dto = slides.get(i);
            SiteBanner banner = new SiteBanner();
            banner.setTitle(dto.getTitle() == null ? "" : dto.getTitle().trim());
            banner.setSubtitle(blankToNull(dto.getSubtitle()));
            banner.setCta(blankToNull(dto.getCta()));
            banner.setCtaLink(blankToNull(dto.getCtaLink()));
            banner.setImage(blankToNull(dto.getImage()));
            banner.setImageFolder(blankToNull(dto.getImageFolder()));
            banner.setAltText(blankToNull(dto.getAltText()));
            banner.setBg(blankToNull(dto.getBg()));
            banner.setActive(dto.getActive() == null || dto.getActive());
            banner.setSortOrder(i);
            banners.add(banner);
        }
        siteBannerRepository.saveAll(banners);
    }

    private void replaceCategories(List<ReqSiteSettingsDTO.CategoryDTO> categories) {
        siteCategoryRepository.deleteAll();
        List<SiteCategory> entities = new java.util.ArrayList<>();
        for (int i = 0; i < categories.size(); i++) {
            ReqSiteSettingsDTO.CategoryDTO dto = categories.get(i);
            SiteCategory category = new SiteCategory();
            category.setName(dto.getName().trim());
            category.setIcon(dto.getIcon().trim());
            category.setPath(dto.getPath().trim());
            category.setColor(dto.getColor().trim());
            category.setActive(dto.getActive() == null || dto.getActive());
            category.setSortOrder(i);
            entities.add(category);
        }
        siteCategoryRepository.saveAll(entities);
    }

    private void replaceNavigationItems(List<ReqSiteSettingsDTO.NavigationItemDTO> items) {
        siteNavigationItemRepository.deleteAll();
        List<SiteNavigationItem> entities = new java.util.ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            ReqSiteSettingsDTO.NavigationItemDTO dto = items.get(i);
            SiteNavigationItem item = new SiteNavigationItem();
            item.setLabel(dto.getLabel().trim());
            item.setPath(dto.getPath().trim());
            item.setActive(dto.getActive() == null || dto.getActive());
            item.setSortOrder(i);
            entities.add(item);
        }
        siteNavigationItemRepository.saveAll(entities);
    }

    private void validateSetting(String key, String value) throws IdInvalidException {
        if (value == null) {
            throw new IdInvalidException("Setting value must not be null");
        }

        if (!ALLOWED_SETTING_KEYS.contains(key)) {
            throw new IdInvalidException("Unsupported setting key: " + key);
        }

        switch (key) {
            case "SHIPPING_FEE":
            case "FREE_SHIP_LIMIT":
                validateNonNegativeLong(key, value);
                break;
            case "BRANDS":
            case "TARGETS":
                validateStringArrayJson(key, value);
                break;
            case "HERO_SLIDES":
                validateHeroSlidesJson(value);
                break;
            case "CATEGORIES":
                validateCategoriesJson(value);
                break;
            case "HEADER_NAV":
                validateHeaderNavJson(value);
                break;
            case "HOTLINE":
                if (value.trim().isEmpty()) {
                    throw new IdInvalidException("HOTLINE must not be blank");
                }
                break;
            default:
                break;
        }
    }

    private void validateSiteSettings(ReqSiteSettingsDTO settings) throws IdInvalidException {
        if (settings == null) {
            throw new IdInvalidException("Settings payload must not be null");
        }
        validateTextList("BRANDS", settings.getBrands());
        validateTextList("TARGETS", settings.getTargets());
        if (settings.getHeroSlides() == null || settings.getCategories() == null || settings.getHeaderNav() == null) {
            throw new IdInvalidException("Settings lists must not be null");
        }

        for (ReqSiteSettingsDTO.HeroSlideDTO slide : settings.getHeroSlides()) {
            if (slide == null) {
                throw new IdInvalidException("HERO_SLIDES must not contain null items");
            }
            if (slide.getImage() == null || slide.getImage().trim().isEmpty()) {
                throw new IdInvalidException("HERO_SLIDES.image must not be blank");
            }
            validateInternalPath("HERO_SLIDES.ctaLink", slide.getCtaLink(), true);
        }
        for (ReqSiteSettingsDTO.CategoryDTO category : settings.getCategories()) {
            if (category == null) {
                throw new IdInvalidException("CATEGORIES must not contain null items");
            }
            validateInternalPath("CATEGORIES.path", category.getPath(), false);
        }
        for (ReqSiteSettingsDTO.NavigationItemDTO item : settings.getHeaderNav()) {
            if (item == null) {
                throw new IdInvalidException("HEADER_NAV must not contain null items");
            }
            validateInternalPath("HEADER_NAV.path", item.getPath(), false);
        }
    }

    private void validateTextList(String key, List<String> values) throws IdInvalidException {
        if (values == null) {
            throw new IdInvalidException(key + " must not be null");
        }
        for (String value : values) {
            if (value == null || value.trim().isEmpty()) {
                throw new IdInvalidException(key + " must not contain blank values");
            }
        }
    }

    private List<String> cleanStringList(List<String> values) {
        return values.stream().map(String::trim).filter(value -> !value.isEmpty()).toList();
    }

    private void validateInternalPath(String field, String path, boolean allowBlank) throws IdInvalidException {
        if (path == null || path.trim().isEmpty()) {
            if (allowBlank) {
                return;
            }
            throw new IdInvalidException(field + " must not be blank");
        }
        if (!path.startsWith("/")) {
            throw new IdInvalidException(field + " must start with /");
        }
    }

    private void validateNonNegativeLong(String key, String value) throws IdInvalidException {
        try {
            long parsed = Long.parseLong(value);
            if (parsed < 0) {
                throw new IdInvalidException(key + " must not be negative");
            }
        } catch (NumberFormatException ex) {
            throw new IdInvalidException(key + " must be a valid integer");
        }
    }

    private JsonNode readJsonArray(String key, String value) throws IdInvalidException {
        try {
            JsonNode node = objectMapper.readTree(value);
            if (!node.isArray()) {
                throw new IdInvalidException(key + " must be a JSON array");
            }
            return node;
        } catch (JsonProcessingException ex) {
            throw new IdInvalidException(key + " must be valid JSON");
        }
    }

    private void validateStringArrayJson(String key, String value) throws IdInvalidException {
        JsonNode node = readJsonArray(key, value);
        for (JsonNode item : node) {
            if (!item.isTextual() || item.asText().trim().isEmpty()) {
                throw new IdInvalidException(key + " must contain non-blank text values");
            }
        }
    }

    private void validateHeroSlidesJson(String value) throws IdInvalidException {
        JsonNode node = readJsonArray("HERO_SLIDES", value);
        for (JsonNode item : node) {
            if (!item.isObject()) {
                throw new IdInvalidException("HERO_SLIDES must contain object values");
            }
            if (textField(item, "image").isBlank()) {
                throw new IdInvalidException("HERO_SLIDES.image must not be blank");
            }
            validateInternalPath("HERO_SLIDES.ctaLink", textField(item, "ctaLink"), true);
        }
    }

    private void validateCategoriesJson(String value) throws IdInvalidException {
        JsonNode node = readJsonArray("CATEGORIES", value);
        for (JsonNode item : node) {
            if (!item.isObject()) {
                throw new IdInvalidException("CATEGORIES must contain object values");
            }
            if (textField(item, "name").isBlank() || textField(item, "icon").isBlank()
                    || textField(item, "color").isBlank()) {
                throw new IdInvalidException("CATEGORIES values must include name, icon and color");
            }
            validateInternalPath("CATEGORIES.path", textField(item, "path"), false);
        }
    }

    private void validateHeaderNavJson(String value) throws IdInvalidException {
        JsonNode node = readJsonArray("HEADER_NAV", value);
        for (JsonNode item : node) {
            if (!item.isObject()) {
                throw new IdInvalidException("HEADER_NAV must contain object values");
            }
            if (textField(item, "label").isBlank()) {
                throw new IdInvalidException("HEADER_NAV.label must not be blank");
            }
            validateInternalPath("HEADER_NAV.path", textField(item, "path"), false);
        }
    }

    private List<ReqSiteSettingsDTO.HeroSlideDTO> parseHeroSlides(String value) throws IdInvalidException {
        JsonNode node = readJsonArray("HERO_SLIDES", value);
        List<ReqSiteSettingsDTO.HeroSlideDTO> slides = new java.util.ArrayList<>();
        for (JsonNode item : node) {
            ReqSiteSettingsDTO.HeroSlideDTO slide = new ReqSiteSettingsDTO.HeroSlideDTO();
            slide.setTitle(textField(item, "title"));
            slide.setSubtitle(textField(item, "subtitle"));
            slide.setCta(textField(item, "cta"));
            slide.setCtaLink(textField(item, "ctaLink"));
            slide.setImage(textField(item, "image"));
            slide.setImageFolder(textField(item, "imageFolder"));
            slide.setAltText(textField(item, "altText"));
            slide.setBg(textField(item, "bg"));
            slide.setActive(booleanField(item, "active", true));
            slides.add(slide);
        }
        return slides;
    }

    private List<ReqSiteSettingsDTO.CategoryDTO> parseCategories(String value) throws IdInvalidException {
        JsonNode node = readJsonArray("CATEGORIES", value);
        List<ReqSiteSettingsDTO.CategoryDTO> categories = new java.util.ArrayList<>();
        for (JsonNode item : node) {
            ReqSiteSettingsDTO.CategoryDTO category = new ReqSiteSettingsDTO.CategoryDTO();
            category.setName(textField(item, "name"));
            category.setIcon(textField(item, "icon"));
            category.setPath(textField(item, "path"));
            category.setColor(textField(item, "color"));
            category.setActive(booleanField(item, "active", true));
            categories.add(category);
        }
        return categories;
    }

    private List<ReqSiteSettingsDTO.NavigationItemDTO> parseNavigationItems(String value) throws IdInvalidException {
        JsonNode node = readJsonArray("HEADER_NAV", value);
        List<ReqSiteSettingsDTO.NavigationItemDTO> items = new java.util.ArrayList<>();
        for (JsonNode item : node) {
            ReqSiteSettingsDTO.NavigationItemDTO nav = new ReqSiteSettingsDTO.NavigationItemDTO();
            nav.setLabel(textField(item, "label"));
            nav.setPath(textField(item, "path"));
            nav.setActive(booleanField(item, "active", true));
            items.add(nav);
        }
        return items;
    }

    private String textField(JsonNode item, String field) {
        JsonNode value = item.get(field);
        return value == null || value.isNull() ? "" : value.asText("").trim();
    }

    private Boolean booleanField(JsonNode item, String field, boolean defaultValue) {
        JsonNode value = item.get(field);
        return value == null || value.isNull() ? defaultValue : value.asBoolean(defaultValue);
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private void putSiteContent(Map<String, String> settings, boolean publicOnly) {
        try {
            putStructuredContent(settings, "HERO_SLIDES", bannerDtos(publicOnly));
            putStructuredContent(settings, "CATEGORIES", categoryDtos(publicOnly));
            putStructuredContent(settings, "HEADER_NAV", navigationDtos(publicOnly));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to serialize site content settings", ex);
        }
    }

    private void putStructuredContent(Map<String, String> settings, String key, List<?> values)
            throws JsonProcessingException {
        if (!values.isEmpty() || !settings.containsKey(key)) {
            settings.put(key, objectMapper.writeValueAsString(values));
        }
    }

    private List<ReqSiteSettingsDTO.HeroSlideDTO> bannerDtos(boolean publicOnly) {
        List<SiteBanner> banners = publicOnly
                ? siteBannerRepository.findByActiveTrueOrderBySortOrderAscIdAsc()
                : siteBannerRepository.findAllByOrderBySortOrderAscIdAsc();
        return banners.stream().map(this::toHeroSlideDto).toList();
    }

    private ReqSiteSettingsDTO.HeroSlideDTO toHeroSlideDto(SiteBanner banner) {
        ReqSiteSettingsDTO.HeroSlideDTO dto = new ReqSiteSettingsDTO.HeroSlideDTO();
        dto.setTitle(banner.getTitle());
        dto.setSubtitle(banner.getSubtitle());
        dto.setCta(banner.getCta());
        dto.setCtaLink(banner.getCtaLink());
        dto.setImage(banner.getImage());
        dto.setImageFolder(banner.getImageFolder());
        dto.setAltText(banner.getAltText());
        dto.setBg(banner.getBg());
        dto.setActive(banner.isActive());
        return dto;
    }

    private List<ReqSiteSettingsDTO.CategoryDTO> categoryDtos(boolean publicOnly) {
        List<SiteCategory> categories = publicOnly
                ? siteCategoryRepository.findByActiveTrueOrderBySortOrderAscIdAsc()
                : siteCategoryRepository.findAllByOrderBySortOrderAscIdAsc();
        return categories.stream().map(this::toCategoryDto).toList();
    }

    private ReqSiteSettingsDTO.CategoryDTO toCategoryDto(SiteCategory category) {
        ReqSiteSettingsDTO.CategoryDTO dto = new ReqSiteSettingsDTO.CategoryDTO();
        dto.setName(category.getName());
        dto.setIcon(category.getIcon());
        dto.setPath(category.getPath());
        dto.setColor(category.getColor());
        dto.setActive(category.isActive());
        return dto;
    }

    private List<ReqSiteSettingsDTO.NavigationItemDTO> navigationDtos(boolean publicOnly) {
        List<SiteNavigationItem> items = publicOnly
                ? siteNavigationItemRepository.findByActiveTrueOrderBySortOrderAscIdAsc()
                : siteNavigationItemRepository.findAllByOrderBySortOrderAscIdAsc();
        return items.stream().map(this::toNavigationDto).toList();
    }

    private ReqSiteSettingsDTO.NavigationItemDTO toNavigationDto(SiteNavigationItem item) {
        ReqSiteSettingsDTO.NavigationItemDTO dto = new ReqSiteSettingsDTO.NavigationItemDTO();
        dto.setLabel(item.getLabel());
        dto.setPath(item.getPath());
        dto.setActive(item.isActive());
        return dto;
    }

}
