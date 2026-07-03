package com.example.work.project;

import com.example.work.source.RepoSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByVisibilityIgnoreCaseOrderByFeaturedDescDisplayOrderAscTitleAsc(String visibility);

    @Query("""
        select p
        from Project p
        where p.source = :source
          and p.ownerOrNamespace = :ownerOrNamespace
          and p.repoName = :repoName
    """)
    Optional<Project> findExistingProject(
            RepoSource source,
            String ownerOrNamespace,
            String repoName
    );
}