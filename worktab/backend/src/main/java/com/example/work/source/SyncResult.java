package com.example.work.source;

public record SyncResult(
        String repo,
        String status,
        String message
) {
}