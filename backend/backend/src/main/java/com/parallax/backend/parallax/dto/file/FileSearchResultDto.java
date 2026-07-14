package com.parallax.backend.parallax.dto.file;

public class FileSearchResultDto {
    private String path;
    private int lineNumber;
    private String lineContent;

    public FileSearchResultDto() {}

    public FileSearchResultDto(String path, int lineNumber, String lineContent) {
        this.path = path;
        this.lineNumber = lineNumber;
        this.lineContent = lineContent;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public int getLineNumber() {
        return lineNumber;
    }

    public void setLineNumber(int lineNumber) {
        this.lineNumber = lineNumber;
    }

    public String getLineContent() {
        return lineContent;
    }

    public void setLineContent(String lineContent) {
        this.lineContent = lineContent;
    }
}
