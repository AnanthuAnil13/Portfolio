package com.example.work.project;

import com.example.work.source.SourceSyncService;
import com.example.work.source.SyncSummary;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminController {

    private final SourceSyncService sourceSyncService;

    public AdminController(SourceSyncService sourceSyncService) {
        this.sourceSyncService = sourceSyncService;
    }

    @PostMapping("/api/admin/projects/refresh")
    public SyncSummary refreshProjects() {
        return sourceSyncService.syncAll();
    }
}