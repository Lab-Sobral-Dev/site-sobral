ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS animado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS layers  JSONB   NOT NULL DEFAULT '{}';

INSERT INTO page_content (page, key, value, type)
VALUES ('carousel', 'transition', 'fade', 'text')
ON CONFLICT (page, key) DO NOTHING;
