package com.javaweb.domain.response.product;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ResProductNavigationDTO {
    private final List<CategoryItem> categories;

    @Getter
    @AllArgsConstructor
    public static class CategoryItem {
        private final String name;
        private final long productCount;
        private final List<BrandItem> brands;
    }

    @Getter
    @AllArgsConstructor
    public static class BrandItem {
        private final String name;
        private final long productCount;
    }
}
