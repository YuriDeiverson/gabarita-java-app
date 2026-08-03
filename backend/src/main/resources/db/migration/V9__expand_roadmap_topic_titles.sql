-- Alguns itens de editais são descrições extensas e devem ser preservados integralmente.
ALTER TABLE roadmap_topics
  ALTER COLUMN title TYPE TEXT;
