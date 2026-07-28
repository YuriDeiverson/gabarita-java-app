ALTER TABLE quiz_answer_events
  ADD COLUMN roadmap_topic_id UUID REFERENCES roadmap_topics(id) ON DELETE SET NULL,
  ADD COLUMN topic_title VARCHAR(220);

CREATE INDEX quiz_events_roadmap_topic ON quiz_answer_events(roadmap_topic_id, answered_at);
