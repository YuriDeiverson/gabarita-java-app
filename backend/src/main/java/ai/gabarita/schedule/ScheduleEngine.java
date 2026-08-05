package ai.gabarita.schedule;

import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper json;
    private static final DateTimeFormatter BR=DateTimeFormatter.ofPattern("dd/MM");
    ScheduleEngine(JdbcClient jdbc,ObjectMapper json){this.jdbc=jdbc;this.json=json;}

    public Map<String,Object> agenda(UUID planId,UUID userId,LocalDate start,LocalDate end) {
        if(end.isBefore(start)||ChronoUnit.DAYS.between(start,end)>62)
            throw new IllegalArgumentException("Consulte um período de até 63 dias");
        var plan=jdbc.sql("SELECT settings::text settings_json FROM study_plans WHERE id=:p AND user_id=:u")
                .param("p",planId).param("u",userId).query().listOfRows().stream().findFirst()
                .orElseThrow(()->new NoSuchElementException("Plano não encontrado"));
        var topics=jdbc.sql("""
            SELECT rt.id,rt.title,rt.subject_name,rt.objective,rt.planned_minutes,rt.recommended_questions,
              rt.content::text content_json
            FROM roadmap_topics rt WHERE rt.plan_id=:p AND rt.active
            """).param("p",planId).query().listOfRows();
        var topicsByTitle=new HashMap<String,Map<String,Object>>();
        topics.forEach(topic->topicsByTitle.put(normalize(String.valueOf(topic.get("title"))),topic));

        var days=new TreeMap<LocalDate,List<Map<String,Object>>>();
        var actualDates=new HashSet<LocalDate>();
        var actual=jdbc.sql("""
            SELECT dt.id,dt.task_date::text task_date,dt.roadmap_topic_id,dt.activity_type,dt.planned_minutes,dt.completed_minutes,
              dt.question_goal,dt.questions_answered,dt.correct_answers,dt.achieved_accuracy,dt.status,
              dt.is_optional,dt.outside_planned_hours,
              rt.title,rt.subject_name,rt.objective,rt.content::text content_json
            FROM daily_tasks dt JOIN roadmap_topics rt ON rt.id=dt.roadmap_topic_id
            WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date BETWEEN :start AND :end
            ORDER BY dt.task_date,dt.position
            """).param("u",userId).param("p",planId).param("start",start).param("end",end).query().listOfRows();
        for(var task:actual){
            LocalDate date=LocalDate.parse(String.valueOf(task.get("task_date"))); actualDates.add(date);
            boolean questionPractice="QUESTIONS".equals(String.valueOf(task.get("activity_type")));
            var item=new LinkedHashMap<String,Object>();
            item.put("id",task.get("id"));item.put("roadmap_topic_id",task.get("roadmap_topic_id"));
            boolean optionalQuestion=questionPractice&&Boolean.TRUE.equals(task.get("is_optional"));
            String activity=String.valueOf(task.get("activity_type"));
            item.put("title",activityTitle(activity,optionalQuestion,String.valueOf(task.get("subject_name"))));
            item.put("subject_name",questionPractice?(optionalQuestion?"Treino opcional fora da carga planejada":"Treinamento por questões"):task.get("subject_name"));
            item.put("topic_title",questionPractice?"":task.get("title"));
            item.put("activity_type",task.get("activity_type"));item.put("planned_minutes",task.get("planned_minutes"));
            item.put("studied_minutes",task.get("completed_minutes"));item.put("question_goal",task.get("question_goal"));
            item.put("questions_answered",task.get("questions_answered"));item.put("correct_answers",task.get("correct_answers"));
            item.put("accuracy",task.get("achieved_accuracy"));item.put("status",task.get("status"));
            item.put("is_optional",task.get("is_optional"));item.put("outside_planned_hours",task.get("outside_planned_hours"));
            item.put("objective",task.get("objective"));item.put("review_points",reviewPoints(task.get("content_json")));
            days.computeIfAbsent(date,ignored->new ArrayList<>()).add(item);
        }

        try{
            JsonNode root=json.readTree(String.valueOf(plan.get("settings_json")));
            for(JsonNode week:root.path("legacyScheduleWeeks")) for(JsonNode block:week.path("blocks")){
                String shortDate=block.path("date").asText();
                var candidates=new ArrayList<LocalDate>();
                String fullDate=block.path("isoDate").asText();
                if(!fullDate.isBlank()){try{candidates.add(LocalDate.parse(fullDate));}catch(Exception ignored){}}
                else if(!shortDate.isBlank())for(int year=start.getYear();year<=end.getYear();year++)
                    try{candidates.add(LocalDate.parse(shortDate+"/"+year,DateTimeFormatter.ofPattern("dd/MM/uuuu")));}catch(Exception ignored){}
                for(LocalDate date:candidates){
                    if(date.isBefore(start)||date.isAfter(end)||actualDates.contains(date))continue;
                    String topicTitle=block.path("topicTitle").asText(block.path("title").asText());
                    var topic=topicsByTitle.get(normalize(topicTitle));
                    String activityType=block.path("activityType").asText("PLANNED");
                    boolean questionPractice="QUESTIONS".equals(activityType);
                    String subjectTitle=block.path("subjectTitle").asText(topic==null?"Plano de estudos":String.valueOf(topic.get("subject_name")));
                    var item=new LinkedHashMap<String,Object>();
                    item.put("id",block.path("id").asText("planned-"+date));
                    if(topic!=null)item.put("roadmap_topic_id",topic.get("id"));
                    boolean optionalQuestion=questionPractice&&block.path("isOptional").asBoolean(false);
                    item.put("title",activityTitle(activityType,optionalQuestion,block.path("title").asText(subjectTitle)));
                    item.put("subject_name",questionPractice?(optionalQuestion?"Treino opcional fora da carga planejada":"Treinamento por questões"):subjectTitle);
                    item.put("topic_title",questionPractice?"":topicTitle);
                    item.put("activity_type",activityType);
                    item.put("planned_minutes",block.path("durationMinutes").asInt(parseMinutes(block.path("duration").asText())));
                    item.put("studied_minutes",0);item.put("question_goal",block.path("questionGoal").asInt(topic==null?0:number(topic.get("recommended_questions"))));
                    item.put("questions_answered",0);item.put("correct_answers",0);item.put("accuracy",null);
                    item.put("status",date.isBefore(LocalDate.now(ZoneId.of("America/Maceio")))?"MISSED":"PLANNED");
                    item.put("is_optional",block.path("isOptional").asBoolean(false));
                    item.put("outside_planned_hours",block.path("outsidePlannedHours").asBoolean(false));
                    item.put("objective","QUESTIONS".equals(item.get("activity_type"))?"Consolidar os assuntos estudados no dia por meio de questões.":topic==null?"Cumprir o bloco previsto para este dia.":topic.get("objective"));
                    var points=topic==null?List.<String>of():reviewPoints(topic.get("content_json"));
                    if(points.isEmpty())points=textItems(block.path("subtopics"));
                    item.put("review_points",points);
                    days.computeIfAbsent(date,ignored->new ArrayList<>()).add(item);
                }
            }
        }catch(Exception ignored){/* Tarefas reais continuam disponíveis mesmo em planos legados sem agenda serializada. */}

        var dayList=new ArrayList<Map<String,Object>>();
        days.forEach((date,items)->{
            int planned=items.stream().filter(item->!Boolean.TRUE.equals(item.get("outside_planned_hours"))).mapToInt(item->number(item.get("planned_minutes"))).sum();
            int studied=items.stream().filter(item->!Boolean.TRUE.equals(item.get("outside_planned_hours"))).mapToInt(item->number(item.get("studied_minutes"))).sum();
            int extraQuestions=items.stream().filter(item->Boolean.TRUE.equals(item.get("outside_planned_hours"))&&!"SKIPPED".equals(item.get("status")))
                    .mapToInt(item->number(item.get("planned_minutes"))).sum();
            int questions=items.stream().mapToInt(item->number(item.get("questions_answered"))).sum();
            int correct=items.stream().mapToInt(item->number(item.get("correct_answers"))).sum();
            boolean complete=items.stream().allMatch(item->"COMPLETED".equals(item.get("status"))
                    || Boolean.TRUE.equals(item.get("is_optional"))&&"SKIPPED".equals(item.get("status")));
            String status=complete?"COMPLETED":studied>0||questions>0?"IN_PROGRESS":date.isBefore(LocalDate.now(ZoneId.of("America/Maceio")))?"MISSED":"PLANNED";
            var day=new LinkedHashMap<String,Object>();day.put("date",date);day.put("status",status);day.put("items",items);
            day.put("planned_minutes",planned);day.put("extra_question_minutes",extraQuestions);day.put("studied_minutes",studied);day.put("questions_answered",questions);day.put("correct_answers",correct);
            dayList.add(day);
        });
        return Map.of("plan_id",planId,"start",start,"end",end,"days",dayList);
    }

    public List<Map<String,Object>> generateLegacy(ScheduleController.GenerateRequest r) {
        var hours=new HashMap<DayOfWeek,Double>();
        r.studyDays().forEach(d->hours.put(day(d.day()),d.hours()));
        var sections=new ArrayList<Section>();
        r.studySections().forEach(n->{
            var cards=new ArrayList<JsonNode>(); n.path("cards").forEach(cards::add);
            sections.add(new Section(n.path("id").asText(),n.path("title").asText(),weight(n.path("weight").asText()),
                    n.path("difficulty").asText(),n.path("learningTrack").asText(),n.path("learningOrder").asInt(Integer.MAX_VALUE),cards));
        });
        if(sections.isEmpty()) throw new IllegalArgumentException("Informe ao menos um assunto");
        var dates=LocalDate.now().datesUntil(r.examDate()).filter(d->hours.containsKey(d.getDayOfWeek())).toList();
        if(dates.isEmpty()) throw new IllegalArgumentException("Não há dias disponíveis até a prova");
        long daysToExam=ChronoUnit.DAYS.between(LocalDate.now(),r.examDate());
        if(daysToExam<=30) return generateDeadlineSchedule(dates,hours,sections,daysToExam);
        int preferredBlock=60;
        if("policial_civil".equals(r.courseId())) return applyLongRangeStrategy(
                generatePoliceSchedule(dates,hours,sections,preferredBlock),dates,hours,sections,r.examDate());
        double weightSum=sections.stream().mapToDouble(Section::weight).sum();
        int totalMinutes=dates.stream().mapToInt(d->availableMinutes(hours.get(d.getDayOfWeek()))).sum();
        var assigned=new HashMap<String,Double>(); var pointers=new HashMap<String,Integer>();
        sections.forEach(s->{assigned.put(s.id(),0d);pointers.put(s.id(),0);});
        var byWeek=new LinkedHashMap<LocalDate,List<Map<String,Object>>>(); int counter=0;
        for(var date:dates){
            int dailyMinutes=availableMinutes(hours.get(date.getDayOfWeek()));
            int questionsMinutes=extraQuestionMinutes(date,dates);
            boolean mandatoryQuestions=lastStudyDayOfWeek(date,dates);
            int remaining=dailyMinutes; String lastSection=null;
            var studiedSubjects=new LinkedHashSet<String>();
            while(remaining>0){
                var ranked=sections.stream().sorted(Comparator.comparingDouble((Section s)->
                      (s.weight()/weightSum*totalMinutes)-assigned.get(s.id())).reversed()).toList();
                Section chosen=ranked.getFirst();
                if(ranked.size()>1&&Objects.equals(chosen.id(),lastSection)) chosen=ranked.get(1);
                int pointer=pointers.merge(chosen.id(),1,Integer::sum)-1;
                JsonNode card=chosen.cards().isEmpty()?null:chosen.cards().get(pointer%chosen.cards().size());
                int duration=Math.min(blockMinutes(chosen,card,preferredBlock),remaining);
                if(duration<60)break;
                lastSection=chosen.id(); assigned.merge(chosen.id(),(double)duration,Double::sum);
                var takeaways=new ArrayList<String>();
                if(card!=null){
                    takeaways.add(card.path("title").asText());
                    card.path("keyTakeaways").forEach(x->{if(takeaways.size()<3)takeaways.add(x.asText());});
                }
                var block=new LinkedHashMap<String,Object>(); block.put("id","block-"+counter++); block.put("day",weekday(date.getDayOfWeek()));
                block.put("date",date.format(BR)); block.put("isoDate",date); block.put("title",chosen.title());
                block.put("subjectTitle",chosen.title()); block.put("topicTitle",card==null?chosen.title():card.path("title").asText());
                block.put("activityType","THEORY");
                block.put("duration",formatMinutes(duration)); block.put("durationMinutes",duration);
                boolean discursive="atualidades_discursiva".equals(chosen.id());
                block.put("methodology",discursive
                    ?"Pomodoro 50+10: produção de redação, seguida de revisão de conteúdo e linguagem"
                    :"Pomodoro 50+10: estudo objetivo do tópico e síntese dos conceitos essenciais"); block.put("subtopics",takeaways); block.put("done",false);
                byWeek.computeIfAbsent(date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),k->new ArrayList<>()).add(block);
                studiedSubjects.add(chosen.title());
                remaining-=duration;
            }
            if(questionsMinutes>0){
                var exercise=new LinkedHashMap<String,Object>();exercise.put("id","block-"+counter++);exercise.put("day",weekday(date.getDayOfWeek()));
                exercise.put("date",date.format(BR));exercise.put("isoDate",date);exercise.put("title","Questões dos assuntos do dia");
                exercise.put("subjectTitle","Treinamento diário");exercise.put("topicTitle","");exercise.put("activityType","QUESTIONS");
                exercise.put("duration",formatMinutes(questionsMinutes));exercise.put("durationMinutes",questionsMinutes);
                exercise.put("questionGoal",Math.max(10,questionsMinutes/3));
                exercise.put("isOptional",!mandatoryQuestions);exercise.put("outsidePlannedHours",true);
                exercise.put("methodology",mandatoryQuestions
                    ?"Revisão semanal obrigatória: 50 minutos de questões e 10 minutos para corrigir os erros"
                    :"Treino extra opcional: 30 minutos de questões da banca e correção dos erros");
                exercise.put("subtopics",new ArrayList<>(studiedSubjects));exercise.put("done",false);
                byWeek.computeIfAbsent(date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),k->new ArrayList<>()).add(exercise);
            }
        }
        var result=new ArrayList<Map<String,Object>>(); int i=0;
        for(var e:byWeek.entrySet()){var w=new LinkedHashMap<String,Object>();w.put("id","week-"+i);w.put("title","Semana "+(++i));w.put("dateRange",e.getKey().format(BR)+" - "+e.getKey().plusDays(6).format(BR));w.put("focus","Plano equilibrado conforme suas prioridades");w.put("blocks",e.getValue());result.add(w);} return applyLongRangeStrategy(result,dates,hours,sections,r.examDate());
    }

    private List<Map<String,Object>> generateDeadlineSchedule(List<LocalDate> dates,Map<DayOfWeek,Double> hours,
            List<Section> sections,long daysToExam){
        var ranked=rankedTopics(sections);
        int paretoCount=Math.max(1,(int)Math.ceil(ranked.size()*.20));
        int expandedCount=Math.max(paretoCount,(int)Math.ceil(ranked.size()*.50));
        var priorityPool=ranked.subList(0,Math.min(ranked.size(),daysToExam<=15?paretoCount:expandedCount));
        int mappingDays=dates.size()==1?0:daysToExam<=15
                ?Math.min(2,Math.max(1,dates.size()-Math.min(4,Math.max(1,dates.size()-1))))
                :Math.min(1,Math.max(0,dates.size()-1));
        int finalWindow=daysToExam<=15?4:7;
        int finalDays=Math.min(4,Math.max(1,dates.size()-mappingDays));
        var finalCandidates=dates.subList(Math.min(mappingDays,dates.size()-1),dates.size());
        var finalDates=finalCandidates.stream().filter(date->ChronoUnit.DAYS.between(date,dates.getLast().plusDays(1))<=finalWindow)
                .toList();
        if(finalDates.isEmpty()) finalDates=dates.subList(Math.max(mappingDays,dates.size()-finalDays),dates.size());
        else if(daysToExam<=15&&finalDates.size()>4) finalDates=finalDates.subList(finalDates.size()-4,finalDates.size());
        finalDays=finalDates.size();
        LocalDate firstFinal=finalDates.getFirst();
        var blocks=new ArrayList<Map<String,Object>>();int[] counter={0};int[] topicPointer={0};
        for(int index=0;index<dates.size();index++){
            LocalDate date=dates.get(index);int minutes=availableMinutes(hours.get(date.getDayOfWeek()));
            if(index<mappingDays){
                blocks.addAll(deadlineDayBlocks(date,minutes,ranked,priorityPool,topicPointer,counter,"READING",
                        "Mapeamento prioritário do edital",
                        "Pomodoro de reta final: cruze o assunto com a incidência da banca e registre somente os pontos decisivos."));
            }else if(!date.isBefore(firstFinal)){
                int finalIndex=finalDates.indexOf(date);
                String activity=finalIndex==Math.max(0,finalDays-3)?"SIMULATION":finalIndex==finalDays-2?"REVIEW":"FLASHCARDS";
                String title=switch(activity){
                    case "SIMULATION"->"Simulado dirigido de reta final";
                    case "REVIEW"->"Dia-colchão: reforço dos erros";
                    default->finalIndex==finalDays-1?"Revisão leve pré-prova":"Revisão ativa de reta final";
                };
                blocks.addAll(deadlineDayBlocks(date,minutes,ranked,priorityPool,topicPointer,counter,activity,title,
                        "Pomodoro de reta final: revise o que já foi estudado, corrija erros e não abra conteúdo novo."));
            }else{
                blocks.addAll(deadlineDayBlocks(date,minutes,ranked,priorityPool,topicPointer,counter,"THEORY",
                        "Teoria enxuta de alta incidência",
                        "Pomodoro 50+10: estude apenas os conceitos de maior retorno e produza uma síntese curta."));
            }
        }
        String focus=daysToExam<=15
                ?"Reta final de 15 dias: prioridade por peso, apoio leve e questões no encerramento de todos os dias"
                :"Plano de 1 mês: peso e incidência primeiro, assunto leve de apoio e fechamento diário com questões";
        return weeks(blocks,focus);
    }

    private List<Map<String,Object>> deadlineDayBlocks(LocalDate date,int minutes,List<TopicChoice> ranked,
            List<TopicChoice> priorityPool,int[] topicPointer,int[] counter,String contentActivity,
            String contentTitle,String contentMethodology){
        var result=new ArrayList<Map<String,Object>>();
        int highMinutes,lightMinutes=0,questionMinutes;
        if(minutes<=30){
            highMinutes=Math.max(1,(int)Math.ceil(minutes*.60));questionMinutes=Math.max(1,minutes-highMinutes);
        }else if(minutes<60){
            highMinutes=(int)Math.ceil(minutes*.60);questionMinutes=minutes-highMinutes;
        }else if(minutes==60){
            // Um único horário curto: 25 min de assunto, 10 min de intervalo e 25 min de questões.
            highMinutes=35;questionMinutes=25;
        }else if(minutes<120){
            questionMinutes=Math.max(25,(int)Math.round(minutes*.40));highMinutes=minutes-questionMinutes;
        }else{
            questionMinutes=60;
            int contentMinutes=minutes-questionMinutes;
            if(minutes>120&&ranked.size()>1){lightMinutes=Math.min(60,contentMinutes/2);}
            highMinutes=contentMinutes-lightMinutes;
        }

        var studiedTopics=new ArrayList<String>();
        int highRemaining=highMinutes;
        while(highRemaining>0){
            int duration=Math.min(60,highRemaining);
            TopicChoice high=priorityPool.get(topicPointer[0]++%priorityPool.size());
            String title=contentTitle+": "+high.title();
            var item=block("deadline-"+(counter[0]++),date,high,contentActivity,duration,title,
                    duration==35?"Pomodoro curto: 25 minutos de foco e 10 minutos de intervalo.":contentMethodology,
                    topicDetails(high),false,false);
            item.put("priorityBand","HIGH");result.add(item);studiedTopics.add(high.title());highRemaining-=duration;
        }
        if(lightMinutes>0){
            TopicChoice light=lightTopic(ranked,studiedTopics,topicPointer[0]);
            var item=block("deadline-"+(counter[0]++),date,light,contentActivity,lightMinutes,
                    "Assunto leve de apoio: "+light.title(),
                    "Pomodoro 50+10: consolide um assunto de menor peso sem retirar o foco da prioridade do dia.",
                    topicDetails(light),false,false);
            item.put("priorityBand","LIGHT");result.add(item);studiedTopics.add(light.title());
        }
        TopicChoice questionTopic=priorityPool.get(Math.floorMod(topicPointer[0]-1,priorityPool.size()));
        var questionDetails=new ArrayList<String>(studiedTopics);
        if(questionDetails.isEmpty())questionDetails.add(questionTopic.title());
        var questions=block("deadline-"+(counter[0]++),date,questionTopic,"QUESTIONS",questionMinutes,
                "Questões de fechamento",
                questionMinutes<30?"Tempo livre: resolva e corrija questões até encerrar a disponibilidade do dia."
                        :"Finalize o dia resolvendo questões dos assuntos estudados e registrando os erros.",
                questionDetails,false,false);
        questions.put("priorityBand","PRACTICE");result.add(questions);
        return result;
    }

    private TopicChoice lightTopic(List<TopicChoice> ranked,List<String> excluded,int rotation){
        var candidates=new ArrayList<TopicChoice>();
        for(int index=ranked.size()-1;index>=0;index--){
            TopicChoice candidate=ranked.get(index);
            if(!excluded.contains(candidate.title()))candidates.add(candidate);
        }
        return candidates.isEmpty()?ranked.getLast():candidates.get(Math.floorMod(rotation,candidates.size()));
    }

    private List<Map<String,Object>> applyLongRangeStrategy(List<Map<String,Object>> base,List<LocalDate> dates,
            Map<DayOfWeek,Double> hours,List<Section> sections,LocalDate examDate){
        LocalDate sprintStart=examDate.minusDays(21);
        var sprintDates=dates.stream().filter(date->!date.isBefore(sprintStart)).toList();
        var retained=base.stream().flatMap(week->((List<Map<String,Object>>)week.get("blocks")).stream())
                .filter(block->{LocalDate date=(LocalDate)block.get("isoDate");return !date.equals(dates.getFirst())&&!sprintDates.contains(date);})
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        TopicChoice diagnostic=rankedTopics(sections).getFirst();
        retained.add(block("diagnostic-0",dates.getFirst(),diagnostic,"SIMULATION",
                availableMinutes(hours.get(dates.getFirst().getDayOfWeek())),"Diagnóstico inicial: prova antiga completa",
                "Faça uma prova antiga completa e cronometrada para medir suas fraquezas reais antes de ajustar o ciclo.",
                List.of("Precisão por disciplina","Tempo por questão","Caderno de erros inicial"),false,false));
        if(!sprintDates.isEmpty()){
            var sprint=generateDeadlineSchedule(sprintDates,hours,sections,15);
            sprint.forEach(week->retained.addAll((List<Map<String,Object>>)week.get("blocks")));
        }
        markSpacedReview(retained,dates,1);
        markSpacedReview(retained,dates,7);
        markSpacedReview(retained,dates,30);
        return weeks(retained,"Ciclo por peso com teoria e questões desde o início; revisões D+1, D+7 e D+30 e reta final em modo intensivo");
    }

    private void markSpacedReview(List<Map<String,Object>> blocks,List<LocalDate> dates,int offset){
        LocalDate target=dates.getFirst().plusDays(offset);
        var studyDate=dates.stream().filter(date->!date.isBefore(target)).findFirst();
        if(studyDate.isEmpty())return;
        blocks.stream().filter(block->studyDate.get().equals(block.get("isoDate")))
                .filter(block->"THEORY".equals(block.get("activityType"))).findFirst().ifPresent(block->{
                    block.put("activityType","REVIEW");
                    block.put("methodology","Revisão espaçada D+"+offset+": recuperação ativa antes de consultar o resumo e questões curtas dos erros.");
                });
    }

    private List<TopicChoice> rankedTopics(List<Section> sections){
        var result=new ArrayList<TopicChoice>();
        for(Section section:sections){
            if(section.cards().isEmpty())result.add(new TopicChoice(section,null,priority(section,null)));
            else for(JsonNode card:section.cards())result.add(new TopicChoice(section,card,priority(section,card)));
        }
        result.sort(Comparator.comparingDouble(TopicChoice::score).reversed().thenComparing(TopicChoice::title));
        return result;
    }

    private double priority(Section section,JsonNode card){
        String difficulty=normalize(section.difficulty());
        double learnability=difficulty.contains("facil")?1:difficulty.contains("medio")?0.75:0.5;
        double incidence=card!=null&&(card.path("isQuente").asBoolean()||normalize(card.path("paretoRatio").asText()).contains("alta"))?1.25:1;
        return Math.max(1,section.weight())*learnability*incidence;
    }

    private Map<String,Object> block(String id,LocalDate date,TopicChoice topic,String activity,int minutes,String title,
            String methodology,List<String> details,boolean optional,boolean outside){
        var block=new LinkedHashMap<String,Object>();block.put("id",id);block.put("day",weekday(date.getDayOfWeek()));
        block.put("date",date.format(BR));block.put("isoDate",date);block.put("title",title);
        block.put("subjectTitle",topic.section().title());block.put("topicTitle",topic.title());block.put("activityType",activity);
        block.put("duration",formatMinutes(minutes));block.put("durationMinutes",minutes);
        if("QUESTIONS".equals(activity)||"SIMULATION".equals(activity))block.put("questionGoal",Math.max(10,minutes/3));
        block.put("isOptional",optional);block.put("outsidePlannedHours",outside);
        block.put("methodology",methodology);block.put("subtopics",details);block.put("done",false);return block;
    }

    private List<String> topicDetails(TopicChoice topic){
        var details=new ArrayList<String>();details.add(topic.title());
        if(topic.card()!=null)topic.card().path("keyTakeaways").forEach(value->{if(details.size()<3)details.add(value.asText());});
        return details;
    }

    private List<Map<String,Object>> weeks(List<Map<String,Object>> blocks,String focus){
        blocks.sort(Comparator.comparing(block->(LocalDate)block.get("isoDate")));
        var grouped=new LinkedHashMap<LocalDate,List<Map<String,Object>>>();
        for(var block:blocks){LocalDate date=(LocalDate)block.get("isoDate");grouped.computeIfAbsent(date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),ignored->new ArrayList<>()).add(block);}
        var result=new ArrayList<Map<String,Object>>();int index=0;
        for(var entry:grouped.entrySet()){var week=new LinkedHashMap<String,Object>();week.put("id","week-"+index);week.put("title","Semana "+(++index));week.put("dateRange",entry.getKey().format(BR)+" - "+entry.getKey().plusDays(6).format(BR));week.put("focus",focus);week.put("blocks",entry.getValue());result.add(week);}return result;
    }

    private List<Map<String,Object>> generatePoliceSchedule(List<LocalDate> dates,Map<DayOfWeek,Double> hours,
            List<Section> sections,int preferredBlock){
        var sectionsById=new HashMap<String,Section>();sections.forEach(section->sectionsById.put(section.id(),section));
        var topicPointers=new HashMap<String,Integer>();var groupPointers=new HashMap<String,Integer>();
        sections.forEach(section->topicPointers.put(section.id(),0));
        boolean completeWorkweek=List.of(DayOfWeek.MONDAY,DayOfWeek.TUESDAY,DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,DayOfWeek.FRIDAY).stream().allMatch(hours::containsKey);
        var byWeek=new LinkedHashMap<LocalDate,List<Map<String,Object>>>();int counter=0;
        LocalDate firstWeek=dates.getFirst().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        for(LocalDate date:dates){
            int dailyMinutes=availableMinutes(hours.get(date.getDayOfWeek()));
            int questionsMinutes=extraQuestionMinutes(date,dates);
            boolean mandatoryQuestions=lastStudyDayOfWeek(date,dates);
            int studyMinutes=dailyMinutes;
            var base=completeWorkweek&&policeDayTemplate().containsKey(date.getDayOfWeek())
                    ?policeDayTemplate().get(date.getDayOfWeek()):policeWeeklyTemplate();
            var supportedBase=base.stream().filter(allocation->!policeGroup(allocation.group(),sectionsById).isEmpty()).toList();
            if(supportedBase.isEmpty())supportedBase=policeWeeklyTemplate().stream()
                    .filter(allocation->!policeGroup(allocation.group(),sectionsById).isEmpty()).toList();
            int rotation=(int)ChronoUnit.WEEKS.between(firstWeek,date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)));
            var allocations=scaleAllocations(supportedBase,studyMinutes,rotation);
            var studiedSubjects=new LinkedHashSet<String>();
            for(var allocation:allocations){
                var group=policeGroup(allocation.group(),sectionsById);
                if(group.isEmpty())continue;
                int remaining=allocation.minutes();
                while(remaining>0){
                    int groupPointer=groupPointers.merge(allocation.group(),1,Integer::sum)-1;
                    Section chosen=group.get(groupPointer%group.size());
                    int topicPointer=topicPointers.merge(chosen.id(),1,Integer::sum)-1;
                    JsonNode card=chosen.cards().isEmpty()?null:chosen.cards().get(topicPointer%chosen.cards().size());
                    int duration=Math.min(remaining,blockMinutes(chosen,card,preferredBlock));
                    if(duration<60)duration=remaining;
                    var details=new ArrayList<String>();
                    if(card!=null){details.add(card.path("title").asText());card.path("keyTakeaways").forEach(value->{if(details.size()<3)details.add(value.asText());});}
                    var block=new LinkedHashMap<String,Object>();block.put("id","block-"+counter++);block.put("day",weekday(date.getDayOfWeek()));
                    block.put("date",date.format(BR));block.put("isoDate",date);block.put("title",chosen.title());
                    block.put("subjectTitle",chosen.title());block.put("topicTitle",card==null?chosen.title():card.path("title").asText());
                    block.put("activityType","THEORY");block.put("duration",formatMinutes(duration));block.put("durationMinutes",duration);
                    block.put("methodology",date.getDayOfWeek()==DayOfWeek.FRIDAY
                            ?"Pomodoro 50+10: revisão ativa, questões CEBRASPE e correção de erros"
                            :"Pomodoro 50+10: estudo progressivo do tópico e aplicação por questões curtas");
                    block.put("subtopics",details);block.put("done",false);
                    byWeek.computeIfAbsent(date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),key->new ArrayList<>()).add(block);
                    studiedSubjects.add(chosen.title());
                    remaining-=duration;
                }
            }
            if(questionsMinutes>0){
                var exercise=new LinkedHashMap<String,Object>();exercise.put("id","block-"+counter++);exercise.put("day",weekday(date.getDayOfWeek()));
                exercise.put("date",date.format(BR));exercise.put("isoDate",date);exercise.put("title","Questões dos assuntos do dia");
                exercise.put("subjectTitle","Treinamento diário");exercise.put("topicTitle","");exercise.put("activityType","QUESTIONS");
                exercise.put("duration",formatMinutes(questionsMinutes));exercise.put("durationMinutes",questionsMinutes);
                exercise.put("questionGoal",Math.max(10,questionsMinutes/3));
                exercise.put("isOptional",!mandatoryQuestions);exercise.put("outsidePlannedHours",true);
                exercise.put("methodology",mandatoryQuestions
                    ?"Revisão semanal obrigatória: 50 minutos de questões CEBRASPE e 10 minutos para corrigir os erros"
                    :"Treino extra opcional: 30 minutos de questões CEBRASPE e correção dos erros");
                exercise.put("subtopics",new ArrayList<>(studiedSubjects));exercise.put("done",false);
                byWeek.computeIfAbsent(date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),key->new ArrayList<>()).add(exercise);
            }
        }
        var result=new ArrayList<Map<String,Object>>();int weekIndex=0;
        for(var entry:byWeek.entrySet()){var week=new LinkedHashMap<String,Object>();week.put("id","week-"+weekIndex);week.put("title","Semana "+(++weekIndex));week.put("dateRange",entry.getKey().format(BR)+" - "+entry.getKey().plusDays(6).format(BR));week.put("focus","PC-AL: 38,3% conhecimentos básicos e 61,7% conhecimentos específicos");week.put("blocks",entry.getValue());result.add(week);}return result;
    }

    private Map<DayOfWeek,List<PoliceAllocation>> policeDayTemplate(){
        return Map.of(
          DayOfWeek.MONDAY,List.of(pa("portugues",60),pa("ti",60),pa("constitucional",60),pa("penal",60),pa("estatistica_dados",60),pa("logico",60)),
          DayOfWeek.TUESDAY,List.of(pa("portugues",30),pa("ti",60),pa("administrativo",60),pa("processual",60),pa("legislacao_especial",60),pa("contabilidade_financeira",60),pa("direitos_humanos",30)),
          DayOfWeek.WEDNESDAY,List.of(pa("portugues",60),pa("ti",60),pa("penal",60),pa("processual",60),pa("estatistica_dados",60),pa("crimes_ciberneticos",60)),
          DayOfWeek.THURSDAY,List.of(pa("portugues",30),pa("ti",60),pa("constitucional",30),pa("administrativo",30),pa("legislacao_institucional",60),pa("legislacao_especial",60),pa("contabilidade_financeira",60),pa("atualidades_etica",30)),
          DayOfWeek.FRIDAY,List.of(pa("portugues",30),pa("logico",60),pa("direitos_humanos",30),pa("atualidades_etica",30),pa("penal",30),pa("processual",30),pa("legislacao_institucional",30),pa("legislacao_especial",30),pa("estatistica_dados",30),pa("crimes_ciberneticos",60))
        );
    }
    private List<PoliceAllocation> policeWeeklyTemplate(){return List.of(pa("portugues",210),pa("ti",240),pa("logico",120),pa("direitos_humanos",60),pa("atualidades_etica",60),pa("constitucional",90),pa("administrativo",90),pa("penal",150),pa("processual",150),pa("legislacao_institucional",90),pa("legislacao_especial",150),pa("contabilidade_financeira",120),pa("estatistica_dados",150),pa("crimes_ciberneticos",120));}
    private PoliceAllocation pa(String group,int minutes){return new PoliceAllocation(group,minutes);}
    private List<PoliceAllocation> scaleAllocations(List<PoliceAllocation> base,int totalMinutes,int rotation){
        int baseTotal=base.stream().mapToInt(PoliceAllocation::minutes).sum();int units=Math.max(1,totalMinutes/60);
        var scaled=new ArrayList<ScaledAllocation>();int used=0;
        for(int position=0;position<base.size();position++){var allocation=base.get(position);double exact=(double)allocation.minutes()/baseTotal*units;int floor=(int)Math.floor(exact);scaled.add(new ScaledAllocation(allocation.group(),floor,exact-floor,position));used+=floor;}
        scaled.sort(Comparator.comparingDouble(ScaledAllocation::remainder).reversed()
                .thenComparingInt(item->Math.floorMod(item.position()-rotation,base.size())));
        for(int index=0;index<units-used;index++)scaled.get(index%scaled.size()).units++;
        scaled.sort(Comparator.comparingInt(ScaledAllocation::position));
        var result=new ArrayList<PoliceAllocation>();for(var item:scaled)if(item.units>0)result.add(pa(item.group(),item.units*60));
        return result;
    }
    private List<Section> policeGroup(String group,Map<String,Section> sections){
        var ids=switch(group){
          case "portugues"->List.of("portugues");case "ti"->List.of("pc_ti_seguranca_cibernetica");case "logico"->List.of("pc_raciocinio_logico_matematico");
          case "direitos_humanos"->List.of("pc_direitos_humanos");case "atualidades_etica"->List.of("pc_atualidades","etica_servico_publico");
          case "constitucional"->List.of("pc_direito_constitucional");case "administrativo"->List.of("pc_direito_administrativo");case "penal"->List.of("pc_direito_penal");
          case "processual"->List.of("pc_direito_processual_penal");case "legislacao_institucional"->List.of("pc_legislacao_institucional_alagoas");
          case "legislacao_especial"->List.of("pc_legislacao_penal_especial");case "contabilidade_financeira"->List.of("pc_contabilidade","pc_analise_financeira_crimes_tributarios","pc_contabilidade_analise_financeira");
          case "estatistica_dados"->List.of("pc_estatistica","pc_analise_dados","pc_estatistica_analise_dados");case "crimes_ciberneticos"->List.of("pc_crimes_ciberneticos_seguranca_digital");default->List.<String>of();};
        var result=new ArrayList<Section>();for(String id:ids)if(sections.containsKey(id))result.add(sections.get(id));return result;
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
                var start=(LocalTime)slot.get("start_time"); var end=(LocalTime)slot.get("end_time"); int minutes=60;
                for(var at=start;!at.plusMinutes(minutes).isAfter(end);at=at.plusMinutes(minutes)){
                    var topic=topics.get(topicCursor++%topics.size()); String type=(position>0&&position%7==0)?"REVIEW":"STUDY";
                    if(ChronoUnit.DAYS.between(current,exam)<=((Number)plan.get("final_sprint_days")).intValue() && position%5==0) type="SIMULATION";
                    jdbc.sql("INSERT INTO schedule_blocks(id,plan_id,topic_id,block_type,starts_at,duration_minutes,position,title,methodology,details) VALUES(gen_random_uuid(),:p,:t,:type,:at,:duration,:pos,:title,:method,CAST(:details AS jsonb))")
                      .param("p",planId).param("t",topic.get("id")).param("type",type).param("at",current.atTime(at).atZone(ZoneId.of("America/Maceio")).toOffsetDateTime()).param("duration",minutes).param("pos",position++).param("title",type.equals("SIMULATION")?"Simulado de reta final":topic.get("name")).param("method",type.equals("REVIEW")?"Pomodoro 50+10: repetição espaçada":"Pomodoro 50+10: teoria, exercícios e síntese").param("details","{\"generated\":true}").update(); created++;
                }
            } cursor=cursor.plusDays(1);
        }
        jdbc.sql("UPDATE study_plans SET updated_at=now(),version=version+1 WHERE id=:p").param("p",planId).update();
        return Map.of("planId",planId,"blocksCreated",created,"warning",created<topics.size()?"Tempo insuficiente: reduza assuntos ou aumente a disponibilidade":"Cronograma recalculado com sucesso");
    }
    private record Section(String id,String title,double weight,String difficulty,String learningTrack,int learningOrder,List<JsonNode> cards){}
    private record TopicChoice(Section section,JsonNode card,double score){private String title(){return card==null?section.title():card.path("title").asText(section.title());}}
    private record PoliceAllocation(String group,int minutes){}
    private static final class ScaledAllocation{private final String group;private int units;private final double remainder;private final int position;private ScaledAllocation(String group,int units,double remainder,int position){this.group=group;this.units=units;this.remainder=remainder;this.position=position;}private String group(){return group;}private double remainder(){return remainder;}private int position(){return position;}}
    private List<String> reviewPoints(Object content){try{return textItems(json.readTree(String.valueOf(content)).path("keyTakeaways"));}catch(Exception ignored){return List.of();}}
    private String activityTitle(String activity,boolean optional,String fallback){return switch(activity){
        case "QUESTIONS"->optional?"Questões extras do dia":"Questões comentadas";
        case "SIMULATION"->"Simulado cronometrado";
        case "FLASHCARDS"->"Revisão por flashcards";
        case "READING"->"Mapeamento do edital × banca";
        case "REVIEW","REVISION"->fallback;
        default->fallback;
    };}
    private List<String> textItems(JsonNode node){var values=new ArrayList<String>();if(node!=null&&node.isArray())for(JsonNode value:node){if(values.size()==3)break;String text=value.asText().trim();if(!text.isBlank())values.add(text);}return values;}
    private int number(Object value){return value instanceof Number number?number.intValue():0;}
    private int blockMinutes(Section section,JsonNode card,int preferredMinutes){return 60;}
    private int extraQuestionMinutes(LocalDate date,List<LocalDate> dates){return lastStudyDayOfWeek(date,dates)?60:30;}
    private boolean lastStudyDayOfWeek(LocalDate date,List<LocalDate> dates){
        LocalDate week=date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return dates.stream().noneMatch(other->other.isAfter(date)
                && other.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).equals(week));
    }
    private int availableMinutes(double hours){return Math.max(15,(int)Math.round(hours*60));}
    private int parseMinutes(String value){try{String normalized=value.toLowerCase();int hours=0,minutes=0;var hour=java.util.regex.Pattern.compile("(\\d+)h").matcher(normalized);if(hour.find())hours=Integer.parseInt(hour.group(1));var minute=java.util.regex.Pattern.compile("(\\d+)min").matcher(normalized);if(minute.find())minutes=Integer.parseInt(minute.group(1));return Math.max(15,hours*60+minutes);}catch(Exception ignored){return 60;}}
    private String normalize(String value){return java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase(Locale.ROOT).trim();}
    private double weight(String s){try{return Double.parseDouble(s.replace("%",""));}catch(Exception e){return 1;}}
    private String formatHours(double h){int hour=(int)h,min=(int)Math.round((h-hour)*60);return min==0?hour+"h":hour+"h"+String.format("%02d",min);}
    private String formatMinutes(int total){int hour=total/60,min=total%60;if(hour==0)return min+"min";return min==0?hour+"h":hour+"h"+String.format("%02d",min);}
    private DayOfWeek day(String s){String n=java.text.Normalizer.normalize(s,java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase();if(n.startsWith("seg"))return DayOfWeek.MONDAY;if(n.startsWith("ter"))return DayOfWeek.TUESDAY;if(n.startsWith("qua"))return DayOfWeek.WEDNESDAY;if(n.startsWith("qui"))return DayOfWeek.THURSDAY;if(n.startsWith("sex"))return DayOfWeek.FRIDAY;if(n.startsWith("sab"))return DayOfWeek.SATURDAY;if(n.startsWith("dom"))return DayOfWeek.SUNDAY;throw new IllegalArgumentException("Dia inválido: "+s);}
    private String weekday(DayOfWeek d){return switch(d){case MONDAY->"Segunda-feira";case TUESDAY->"Terça-feira";case WEDNESDAY->"Quarta-feira";case THURSDAY->"Quinta-feira";case FRIDAY->"Sexta-feira";case SATURDAY->"Sábado";case SUNDAY->"Domingo";};}
}
