ALTER TABLE catalog_contests
  ADD COLUMN notice_pdf BYTEA,
  ADD COLUMN notice_pdf_name VARCHAR(255),
  ADD COLUMN notice_pdf_size BIGINT,
  ADD COLUMN notice_pdf_updated_at TIMESTAMPTZ;

