CREATE TABLE IF NOT EXISTS page_edits (
 page TEXT PRIMARY KEY,
 draft TEXT NOT NULL DEFAULT '{}',
 published TEXT NOT NULL DEFAULT '{}',
 updated_at TEXT NOT NULL
);
