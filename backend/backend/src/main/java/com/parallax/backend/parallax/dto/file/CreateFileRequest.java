package com.parallax.backend.parallax.dto.file;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateFileRequest {

    @NotBlank
    private String path;   // relative path, e.g. src/foo.py

    @NotBlank
    private String type;   // FILE or FOLDER
}
