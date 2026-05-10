package com.javaweb.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;

@Service
public class FileService {

    private static final Set<String> ALLOWED_FOLDERS = Set.of("product", "logo");

    @Value("${hansport.upload-file.base-path}")
    private String basePath;

    public void createDirectory(String folder) throws IOException {
        Files.createDirectories(resolveFolder(folder));
    }

    public String store(MultipartFile file, String folder) throws IOException {
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String finalName = System.currentTimeMillis() + "-" + safeName;
        Path path = resolveFile(folder, finalName);
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, path,
                    StandardCopyOption.REPLACE_EXISTING);
        }
        return finalName;
    }

    public long getFileLength(String fileName, String folder) {
        Path path = resolveFile(folder, fileName);
        File file = path.toFile();
        if (!file.exists() || file.isDirectory()) {
            return 0;
        }
        return file.length();
    }

    public InputStreamResource getResource(String fileName, String folder)
            throws FileNotFoundException {
        return new InputStreamResource(new FileInputStream(resolveFile(folder, fileName).toFile()));
    }

    private Path resolveFolder(String folder) {
        if (folder == null || !ALLOWED_FOLDERS.contains(folder)) {
            throw new IllegalArgumentException("Folder upload không hợp lệ");
        }
        Path root = Paths.get(basePath).toAbsolutePath().normalize();
        Path folderPath = root.resolve(folder).normalize();
        if (!folderPath.startsWith(root)) {
            throw new IllegalArgumentException("Đường dẫn upload không hợp lệ");
        }
        return folderPath;
    }

    private Path resolveFile(String folder, String fileName) {
        String safeName = StringUtils.cleanPath(fileName == null ? "" : fileName);
        if (safeName.isBlank() || safeName.contains("..") || safeName.contains("/") || safeName.contains("\\")) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }
        return resolveFolder(folder).resolve(safeName).normalize();
    }
}
