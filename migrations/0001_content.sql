CREATE TABLE IF NOT EXISTS entries (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('blog','projects','wiki','content')),
 title TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '',
 process TEXT NOT NULL DEFAULT '', demo_url TEXT NOT NULL DEFAULT '', document_url TEXT NOT NULL DEFAULT '',
 image_url TEXT NOT NULL DEFAULT '', image_alt TEXT NOT NULL DEFAULT '',
 published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)), updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS entries_public ON entries(published,kind,updated_at);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,email TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
