package com.javaweb.domain.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

public class ReqSiteSettingsDTO {
    @NotBlank(message = "Hotline must not be blank")
    private String hotline;

    @NotNull(message = "Shipping fee must not be null")
    @Min(value = 0, message = "Shipping fee must not be negative")
    private Long shippingFee;

    @NotNull(message = "Free ship limit must not be null")
    @Min(value = 0, message = "Free ship limit must not be negative")
    private Long freeShipLimit;

    @NotNull(message = "Brands must not be null")
    private List<String> brands = new ArrayList<>();

    @NotNull(message = "Targets must not be null")
    private List<String> targets = new ArrayList<>();

    @Valid
    @NotNull(message = "Hero slides must not be null")
    private List<HeroSlideDTO> heroSlides = new ArrayList<>();

    @Valid
    @NotNull(message = "Categories must not be null")
    private List<CategoryDTO> categories = new ArrayList<>();

    @Valid
    @NotNull(message = "Header navigation must not be null")
    private List<NavigationItemDTO> headerNav = new ArrayList<>();

    public String getHotline() {
        return hotline;
    }

    public void setHotline(String hotline) {
        this.hotline = hotline;
    }

    public Long getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(Long shippingFee) {
        this.shippingFee = shippingFee;
    }

    public Long getFreeShipLimit() {
        return freeShipLimit;
    }

    public void setFreeShipLimit(Long freeShipLimit) {
        this.freeShipLimit = freeShipLimit;
    }

    public List<String> getBrands() {
        return brands;
    }

    public void setBrands(List<String> brands) {
        this.brands = brands;
    }

    public List<String> getTargets() {
        return targets;
    }

    public void setTargets(List<String> targets) {
        this.targets = targets;
    }

    public List<HeroSlideDTO> getHeroSlides() {
        return heroSlides;
    }

    public void setHeroSlides(List<HeroSlideDTO> heroSlides) {
        this.heroSlides = heroSlides;
    }

    public List<CategoryDTO> getCategories() {
        return categories;
    }

    public void setCategories(List<CategoryDTO> categories) {
        this.categories = categories;
    }

    public List<NavigationItemDTO> getHeaderNav() {
        return headerNav;
    }

    public void setHeaderNav(List<NavigationItemDTO> headerNav) {
        this.headerNav = headerNav;
    }

    public static class HeroSlideDTO {
        @NotBlank(message = "Slide title must not be blank")
        private String title;
        private String subtitle;
        private String cta;
        private String ctaLink;
        private String image;
        private String imageFolder;
        private String altText;
        private String bg;
        private Boolean active = true;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getSubtitle() {
            return subtitle;
        }

        public void setSubtitle(String subtitle) {
            this.subtitle = subtitle;
        }

        public String getCta() {
            return cta;
        }

        public void setCta(String cta) {
            this.cta = cta;
        }

        public String getCtaLink() {
            return ctaLink;
        }

        public void setCtaLink(String ctaLink) {
            this.ctaLink = ctaLink;
        }

        public String getImage() {
            return image;
        }

        public void setImage(String image) {
            this.image = image;
        }

        public String getImageFolder() {
            return imageFolder;
        }

        public void setImageFolder(String imageFolder) {
            this.imageFolder = imageFolder;
        }

        public String getAltText() {
            return altText;
        }

        public void setAltText(String altText) {
            this.altText = altText;
        }

        public String getBg() {
            return bg;
        }

        public void setBg(String bg) {
            this.bg = bg;
        }

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }
    }

    public static class CategoryDTO {
        @NotBlank(message = "Category name must not be blank")
        private String name;

        @NotBlank(message = "Category icon must not be blank")
        private String icon;

        @NotBlank(message = "Category path must not be blank")
        private String path;

        @NotBlank(message = "Category color must not be blank")
        private String color;

        private Boolean active = true;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getIcon() {
            return icon;
        }

        public void setIcon(String icon) {
            this.icon = icon;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }
    }

    public static class NavigationItemDTO {
        @NotBlank(message = "Navigation label must not be blank")
        private String label;

        @NotBlank(message = "Navigation path must not be blank")
        private String path;

        private Boolean active = true;

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public Boolean getActive() {
            return active;
        }

        public void setActive(Boolean active) {
            this.active = active;
        }
    }
}
