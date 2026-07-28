package ai.gabarita.schedule;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduleEngine {
    private final JdbcClient jdbc;
    private static final DateTimeFormatter BR=DateTimeFormatter.ofPattern("dd/MM");
    ScheduleEngine(JdbcClient jdbc){this.jdbc=jdbc;}

    public List<Map<String,Object>> generateLegacy(ScheduleController.GenerateRequest r) {
        var hours=new HashMap<DayOfWeek,Double>();
        r.studyDays().forEach(d->hours.put(day(d.day()),d.hours()));
        var sections=new ArrayList<Section>();
        r.studySections().forEach(n->{
            var cards=new ArrayList<JsonNode>(); n.path("cards").forEach(cards::add);
            sections.add(new Section(n.path("id").asText(),n.path("title").asText(),weight(n.path("weight").asText()),cards));
        });
        if(sections.isEmpty()) throw new IllegalArgumentException("Informe ao menos um assunto");
        var dates=LocalDate.now().datesUntil(r.examDate()).filter(d->hours.containsKey(d.getDayOfWeek())).toList();
        if(dates.isEmpty()) throw new IllegalArgumentException("Não há dias disponíveis até a prova");
        double weightSum=sections.stream().mapToDouble(Section::weight).sum();
        int totalMinutes=(int)Math.round(dates.stream().mapToDouble(d->hours.get(d.getDayOfWeek())*60).sum());
        int preferredBlock=Math.max(30,Math.min(r.blockMinutes()==null?60:r.blockMinutes(),120));
        var assigned=new HashMap<String,Double>(); var pointers=new HashMap<String,Integer>();
        sections.forEach(s->{assigned.put(s.id(),0d);pointers.put(s.id(),0);});
        var byWeek=new LinkedHashMap<LocalDate,List<Map<String,Object>>>(); int counter=0;
        for(var date:dates){
            int remaining=(int)Math.round(hours.get(date.getDayOfWeek())*60); String lastSection=null;
            while(remaining>0){
                int duration=Math.min(preferredBlock,remaining);
                var ranked=sections.stream().sorted(Comparator.comparingDouble((Section s)->
                  (s.weight()/weightSum*totalMinutes)-assigned.get(s.id())).reversed()).toList();
                Section chosen=ranked.getFirst();
                if(ranked.size()>1&&Objects.equals(chosen.id(),lastSection)) chosen=ranked.get(1);
                lastSection=chosen.id(); assigned.merge(chosen.id(),(double)duration,Double::sum);
                int pointer=pointers.merge(chosen.id(),1,Integer::sum)-1;
                JsonNode card=chosen.cards().isEmpty()?null:chosen.cards().get(pointer%chosen.cards().size());
                var takeaways=new ArrayList<String>(); if(card!=null) card.path("keyTakeaways").forEach(x->{if(takeaways.size()<3)takeaways.add(x.asText());});
                var block=new LinkedHashMap<String,Object>(); block.put("id","block-"+counter++); block.put("day",weekday(date.getDayOfWeek()));
                block.put("date",date.format(BR)); block.put("title",card==null?chosen.title():card.path("title").asText());
                block.put("duration",formatMinutes(duration)); block.put("durationMinutes",duration);
                block.put("methodology","30% Teoria, 50% Exercícios, 20% Revisão"); block.put("subtopics",takeaways); block.put("done",false);
                byWeek.computeIfAbsent(date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),k->new ArrayList<>()).add(block);
                remaining-=duration;
            }
        }
        var result=new ArrayList<Map<String,Object>>(); int i=0;
        for(var e:byWeek.entrySet()){var w=new LinkedHashMap<String,Object>();w.put("id","week-"+i);w.put("title","Semana "+(++i));w.put("dateRange",e.getKey().format(BR)+" - "+e.getKey().plusDays(6).format(BR));w.put("focus","Plano equilibrado conforme suas prioridades");w.put("blocks",e.getValue());result.add(w);} return result;
    }

    @Transactional public Map<String,Object> regeneratePlan(UUID planId,UUID userId) {
        var plan=jdbc.sql("SELECT exam_date,block_minutes,break_minutes,final_sprint_days FROM study_plans WHERE id=:p AND user_id=:u").param("p",planId).param("u",userId).query().listOfRows().stream().findFirst().orElseThrow(()->new NoSuchElementException("Plano não encontrado"));
        var availability=jdbc.sql("SELECT weekday,start_time,end_time,COALESCE(block_minutes,:default) block_minutes,COALESCE(break_minutes,:break) break_minutes FROM availability WHERE plan_id=:p ORDER BY weekday,start_time").param("default",plan.get("block_minutes")).param("break",plan.get("break_minutes")).param("p",planId).query().listOfRows();
        if(availability.isEmpty()) throw new IllegalArgumentException("Configure a disponibilidade semanal antes de gerar o cronograma");
        var topics=jdbc.sql("""
          SELECT t.id,t.name,(COALESCE(pt.priority,t.weight*t.frequency*t.difficulty)) priority,
          COALESCE((SELECT AVG(CASE WHEN a.correct THEN 1 ELSE 0 END) FROM answers a WHERE a.user_id=:u AND a.question_id IN(SELECT q.id FROM questions q WHERE q.topic_id=t.id)),0.5) performance
          FROM plan_topics pt JOIN topics t ON t.id=pt.topic_id WHERE pt.plan_id=:p AND pt.enabled ORDER BY priority DESC
          """).param("p",planId).param("u",userId).query().listOfRows();
        if(topics.isEmpty()) throw new IllegalArgumentException("Selecione ao menos um assunto para gerar o cronograma");
        jdbc.sql("DELETE FROM schedule_blocks WHERE plan_id=:p AND status='PENDING'").param("p",planId).update();
        // Motor base: pontua prioridade e fraqueza individual, alterna assuntos e reserva revisões espaçadas.
        LocalDate exam=(LocalDate)plan.get("exam_date"), cursor=LocalDate.now(); int position=0, topicCursor=0, created=0;
        while(cursor.isBefore(exam)){
            int weekday=cursor.getDayOfWeek().getValue()%7; LocalDate current=cursor;
            for(var slot:availability.stream().filter(a->((Number)a.get("weekday")).intValue()==weekday).toList()){
                var start=(LocalTime)slot.get("start_time"); var end=(LocalTime)slot.get("end_time"); int minutes=((Number)slot.get("block_minutes")).intValue(), pause=((Number)slot.get("break_minutes")).intValue();
                for(var at=start;!at.plusMinutes(minutes).isAfter(end);at=at.plusMinutes(minutes+pause)){
                    var topic=topics.get(topicCursor++%topics.size()); String type=(position>0&&position%7==0)?"REVIEW":"STUDY";
                    if(ChronoUnit.DAYS.between(current,exam)<=((Number)plan.get("final_sprint_days")).intValue() && position%5==0) type="SIMULATION";
                    jdbc.sql("INSERT INTO schedule_blocks(id,plan_id,topic_id,block_type,starts_at,duration_minutes,position,title,methodology,details) VALUES(gen_random_uuid(),:p,:t,:type,:at,:duration,:pos,:title,:method,CAST(:details AS jsonb))")
                      .param("p",planId).param("t",topic.get("id")).param("type",type).param("at",current.atTime(at).atZone(ZoneId.of("America/Maceio")).toOffsetDateTime()).param("duration",minutes).param("pos",position++).param("title",type.equals("SIMULATION")?"Simulado de reta final":topic.get("name")).param("method",type.equals("REVIEW")?"Repetição espaçada":"30% Teoria, 50% Exercícios, 20% Revisão").param("details","{\"generated\":true}").update(); created++;
                }
            } cursor=cursor.plusDays(1);
        }
        jdbc.sql("UPDATE study_plans SET updated_at=now(),version=version+1 WHERE id=:p").param("p",planId).update();
        return Map.of("planId",planId,"blocksCreated",created,"warning",created<topics.size()?"Tempo insuficiente: reduza assuntos ou aumente a disponibilidade":"Cronograma recalculado com sucesso");
    }
    private record Section(String id,String title,double weight,List<JsonNode> cards){}
    private double weight(String s){try{return Double.parseDouble(s.replace("%",""));}catch(Exception e){return 1;}}
    private String formatHours(double h){int hour=(int)h,min=(int)Math.round((h-hour)*60);return min==0?hour+"h":hour+"h"+String.format("%02d",min);}
    private String formatMinutes(int total){int hour=total/60,min=total%60;if(hour==0)return min+"min";return min==0?hour+"h":hour+"h"+String.format("%02d",min);}
    private DayOfWeek day(String s){String n=java.text.Normalizer.normalize(s,java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase();if(n.startsWith("seg"))return DayOfWeek.MONDAY;if(n.startsWith("ter"))return DayOfWeek.TUESDAY;if(n.startsWith("qua"))return DayOfWeek.WEDNESDAY;if(n.startsWith("qui"))return DayOfWeek.THURSDAY;if(n.startsWith("sex"))return DayOfWeek.FRIDAY;if(n.startsWith("sab"))return DayOfWeek.SATURDAY;if(n.startsWith("dom"))return DayOfWeek.SUNDAY;throw new IllegalArgumentException("Dia inválido: "+s);}
    private String weekday(DayOfWeek d){return switch(d){case MONDAY->"Segunda-feira";case TUESDAY->"Terça-feira";case WEDNESDAY->"Quarta-feira";case THURSDAY->"Quinta-feira";case FRIDAY->"Sexta-feira";case SATURDAY->"Sábado";case SUNDAY->"Domingo";};}
}
