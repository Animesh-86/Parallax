-- ============================================================
-- Parallax — Initial Schema Migration
-- Version: V1__initial_schema.sql
-- 
-- This migration establishes the baseline schema.
-- Currently disabled (spring.flyway.enabled=false) for H2 dev mode.
-- Enable when migrating to PostgreSQL.
-- ============================================================

-- Note: When Flyway is enabled, set spring.jpa.hibernate.ddl-auto=validate
-- so Hibernate only validates the schema against entities but doesn't modify it.

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255),
    username VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    bio VARCHAR(160),
    location VARCHAR(100),
    avatar_url VARCHAR(500)
);

-- Project files table with indexes
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    path VARCHAR(1024) NOT NULL,
    content TEXT,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_project_files_project_path UNIQUE (project_id, path)
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files (project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_path ON project_files (project_id, path);
