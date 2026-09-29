-- Popula materiais de estudo detalhados para assuntos do concurso ativo
-- Versão simplificada - apenas cria função e índice

-- Drop função existente se ela tiver parâmetros diferentes
DROP FUNCTION IF EXISTS gabarita_subject_normalized(text);
DROP FUNCTION IF EXISTS gabarita_subject_normalized(value);

-- Função para normalizar texto para comparação
CREATE OR REPLACE FUNCTION gabarita_subject_normalized(text TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(
      regexp_replace(
        text,
        '[^a-z0-9\s]', '', 'g'
      ),
      '\s+', ' ', 'g'
    ),
    '^\s+|\s+$', '', 'g'
  ));
END;
$$ LANGUAGE plpgsql;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_roadmap_topics_plan_id ON roadmap_topics(plan_id);
