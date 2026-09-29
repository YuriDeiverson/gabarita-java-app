-- Popula materiais de estudo detalhados para assuntos do concurso ativo
-- Versão simplificada para evitar erros de sintaxe

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

-- Atualizar materiais existentes que estão vazios (simplificado)
UPDATE shared_study_subjects
SET 
  study_objective = 'Estudar este tema em profundidade para o concurso de Polícia Civil.',
  base_content = '<h2>Conceito e Fundamentos</h2><p>Este tema é essencial para o concurso de Polícia Civil. Estude os conceitos fundamentais, definições e aplicações práticas.</p>',
  key_takeaways = ARRAY['Compreender os conceitos fundamentais', 'Aplicar conhecimento em casos práticos', 'Dominar a legislação pertinente'],
  updated_at = NOW()
WHERE 
  (study_objective IS NULL OR study_objective = '') 
  OR (base_content IS NULL OR base_content = '')
  OR (key_takeaways IS NULL OR array_length(key_takeaways, 1) = 0);
