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
public class ResProductImportDTO {
    private boolean dryRun;
    private boolean applied;
    private String fileName;
    private String matchedSheet;
    private int totalRows;
    private int validRows;
    private int errorRows;
    private int createdCount;
    private int updatedCount;
    private int skippedCount;
    private List<String> warnings = new ArrayList<>();
    private List<ResProductImportRowDTO> rows = new ArrayList<>();
}
