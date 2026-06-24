package com.parallax.backend.parallax.dto.execution;

public class TextChange {
    private Range range;
    private Integer rangeLength;
    private String text;
    private Integer rangeOffset;

    public TextChange() {}

    public TextChange(Range range, Integer rangeLength, String text, Integer rangeOffset) {
        this.range = range;
        this.rangeLength = rangeLength;
        this.text = text;
        this.rangeOffset = rangeOffset;
    }

    public Range getRange() { return range; }
    public void setRange(Range range) { this.range = range; }
    public Integer getRangeLength() { return rangeLength; }
    public void setRangeLength(Integer rangeLength) { this.rangeLength = rangeLength; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Integer getRangeOffset() { return rangeOffset; }
    public void setRangeOffset(Integer rangeOffset) { this.rangeOffset = rangeOffset; }

    public static class Range {
        private int startLineNumber;
        private int startColumn;
        private int endLineNumber;
        private int endColumn;

        public Range() {}

        public Range(int startLineNumber, int startColumn, int endLineNumber, int endColumn) {
            this.startLineNumber = startLineNumber;
            this.startColumn = startColumn;
            this.endLineNumber = endLineNumber;
            this.endColumn = endColumn;
        }

        public int getStartLineNumber() { return startLineNumber; }
        public void setStartLineNumber(int startLineNumber) { this.startLineNumber = startLineNumber; }
        public int getStartColumn() { return startColumn; }
        public void setStartColumn(int startColumn) { this.startColumn = startColumn; }
        public int getEndLineNumber() { return endLineNumber; }
        public void setEndLineNumber(int endLineNumber) { this.endLineNumber = endLineNumber; }
        public int getEndColumn() { return endColumn; }
        public void setEndColumn(int endColumn) { this.endColumn = endColumn; }
    }
}
