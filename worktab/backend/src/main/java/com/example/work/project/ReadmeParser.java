package com.example.work.project;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ReadmeParser {

    private static final Pattern FRONTMATTER_PATTERN =
            Pattern.compile("^---\\s*\\R([\\s\\S]*?)\\R---\\s*\\R?([\\s\\S]*)$", Pattern.MULTILINE);

    public Map<String, Object> parseFrontmatter(String readme) {
        Map<String, Object> result = new HashMap<>();

        if (readme == null || readme.isBlank()) {
            return result;
        }

        Matcher matcher = FRONTMATTER_PATTERN.matcher(readme);
        if (!matcher.find()) {
            return result;
        }

        String frontmatter = matcher.group(1);
        String[] lines = frontmatter.split("\\R");

        String currentListKey = null;
        List<String> currentList = null;

        for (String rawLine : lines) {
            String line = rawLine.stripTrailing();

            if (line.isBlank()) {
                continue;
            }

            if (line.startsWith("  - ") || line.startsWith("- ")) {
                if (currentListKey != null && currentList != null) {
                    String item = line.replaceFirst("^\\s*-\\s*", "").trim();
                    if (!item.isBlank()) {
                        currentList.add(item);
                    }
                }
                continue;
            }

            int colonIndex = line.indexOf(':');
            if (colonIndex == -1) {
                continue;
            }

            String key = line.substring(0, colonIndex).trim();
            String value = line.substring(colonIndex + 1).trim();

            if (value.isEmpty()) {
                currentListKey = key;
                currentList = new ArrayList<>();
                result.put(key, currentList);
            } else {
                currentListKey = null;
                currentList = null;
                result.put(key, normalizeScalar(value));
            }
        }

        return result;
    }

    public String extractBody(String readme) {
        if (readme == null || readme.isBlank()) {
            return "";
        }

        Matcher matcher = FRONTMATTER_PATTERN.matcher(readme);
        if (matcher.find()) {
            return matcher.group(2).trim();
        }

        return readme.trim();
    }

    private Object normalizeScalar(String value) {
        String cleaned = stripQuotes(value);

        if ("true".equalsIgnoreCase(cleaned)) {
            return true;
        }
        if ("false".equalsIgnoreCase(cleaned)) {
            return false;
        }

        if (cleaned.matches("^-?\\d+$")) {
            try {
                return Integer.parseInt(cleaned);
            } catch (NumberFormatException ignored) {
            }
        }

        return cleaned;
    }

    private String stripQuotes(String value) {
        String trimmed = value.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }

    public String getString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    public boolean getBoolean(Map<String, Object> data, String key, boolean defaultValue) {
        Object value = data.get(key);
        if (value instanceof Boolean b) return b;
        if (value instanceof String s) return Boolean.parseBoolean(s);
        return defaultValue;
    }

    public Integer getInteger(Map<String, Object> data, String key, Integer defaultValue) {
        Object value = data.get(key);
        if (value instanceof Integer i) return i;
        if (value instanceof String s) {
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException ignored) {
            }
        }
        return defaultValue;
    }

    @SuppressWarnings("unchecked")
    public String getTagsAsCsv(Map<String, Object> data, String key) {
        Object value = data.get(key);

        if (value instanceof List<?> list) {
            return list.stream()
                    .map(String::valueOf)
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");
        }

        if (value instanceof String s) {
            return s;
        }

        return "";
    }
}