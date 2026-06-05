package com.javaweb.controller;

import com.javaweb.domain.response.file.ResUploadFileDTO;
import com.javaweb.service.FileService;
import com.javaweb.util.annotation.ApiMessage;
import com.javaweb.util.error.StorageException;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/files")
    @ApiMessage("Upload single file")
    public ResponseEntity<ResUploadFileDTO> upload(@RequestParam(name = "files", required = false) List<MultipartFile> files,
                                                   @RequestParam("folder") String folder)
            throws IOException, StorageException {
        //validation
        if (files == null || files.isEmpty()) {
            throw new StorageException("file is empty. Please upload the file");
        }

        List<String> fileNames = new ArrayList<>();

        for(MultipartFile file : files) {
            String fileName = file.getOriginalFilename();
            List<String> allowedExtensions = Arrays.asList("pdf", "jpg", "jpeg", "png", "doc", "docx");

            String extension = "";
            if (fileName != null && fileName.lastIndexOf(".") >= 0) {
                extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
            }
            boolean isValid = allowedExtensions.contains(extension);

            if (!isValid) {
                throw new StorageException("Invalid file extension. Only allows " + allowedExtensions.toString());
            }
            //create a directory if not exist
            this.fileService.createDirectory(folder);

            //storage file
            String uploadedFile = this.fileService.store(file, folder);
            fileNames.add(uploadedFile);
        }

        ResUploadFileDTO res = new ResUploadFileDTO(fileNames, Instant.now());
        return ResponseEntity.ok().body(res);
    }

    @GetMapping("/files")
    @ApiMessage("Download a file")
    public ResponseEntity<Resource> download(
            @RequestParam(name = "fileName", required = false) String fileName,
            @RequestParam(name = "folder", required = false) String folder) throws StorageException, FileNotFoundException {
        if (fileName == null || folder == null) {
            throw new StorageException("Missing required params");
        }

        //check file exist
        long fileLength = this.fileService.getFileLength(fileName, folder);
        if (fileLength == 0) {
            throw new StorageException("File not found");
        }

        InputStreamResource resource = this.fileService.getResource(fileName, folder);

        MediaType mediaType = org.springframework.http.MediaTypeFactory
                .getMediaType(fileName)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .contentLength(fileLength)
                .contentType(mediaType)
                .body(resource);
    }
}
