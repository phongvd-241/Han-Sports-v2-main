package com.javaweb.domain.response.product;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResProductImportRowDTO {
    private int rowNumber;
    private String sku;
    private String name;
    private String action;
    private String status;
    private List<String> errors = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();
}
