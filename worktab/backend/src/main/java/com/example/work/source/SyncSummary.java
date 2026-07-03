package com.example.work.source;

import java.util.List;

public record SyncSummary(
        int syncedCount,
        int failedCount,
        List<SyncResult> results
) {
}