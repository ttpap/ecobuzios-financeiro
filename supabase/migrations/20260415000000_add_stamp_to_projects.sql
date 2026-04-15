-- Add stamp fields to projects table (one stamp image per project)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS stamp_path       text,
  ADD COLUMN IF NOT EXISTS stamp_file_name  text,
  ADD COLUMN IF NOT EXISTS stamp_size_bytes bigint;
