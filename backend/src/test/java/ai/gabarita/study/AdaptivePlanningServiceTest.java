package ai.gabarita.study;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AdaptivePlanningServiceTest {
    @Test
    void convertsDeclaredAvailabilityIntoFixedOneHourSessions() {
        var capacity=AdaptivePlanningService.capacityFor(240);
        assertEquals(240,capacity.plannedMinutes());
        assertEquals(0,capacity.reserveMinutes());
        assertEquals(240,capacity.plannedMinutes()+capacity.reserveMinutes());
        assertEquals(0,capacity.practiceMinutes());
        var residualCapacity=AdaptivePlanningService.capacityFor(150);
        assertEquals(120,residualCapacity.plannedMinutes());
        assertEquals(30,residualCapacity.reserveMinutes());
    }

    @Test
    void dueReviewOutranksAnEquivalentNewTopic() {
        LocalDate today=LocalDate.of(2026,8,28);
        Map<String,Object> normal=topic();
        Map<String,Object> review=new HashMap<>(normal);
        review.put("review_scheduled_date",today.minusDays(2));
        review.put("review_due",true);
        review.put("overdue_days",2);

        assertTrue(AdaptivePlanningService.score(review,0,today)
                > AdaptivePlanningService.score(normal,0,today));
    }

    @Test
    void repeatedSchedulingReducesPriorityToRotateThePlan() {
        LocalDate today=LocalDate.of(2026,8,28);
        Map<String,Object> topic=topic();
        assertTrue(AdaptivePlanningService.score(topic,0,today)
                > AdaptivePlanningService.score(topic,2,today));
    }

    @Test
    void anUnseenLowWeightTopicIsCoveredBeforeRepeatingAnotherTopic() {
        LocalDate today=LocalDate.of(2026,8,28);
        Map<String,Object> low=topic();low.put("priority",5d);
        Map<String,Object> high=topic();high.put("priority",50d);
        assertTrue(AdaptivePlanningService.score(low,0,today)
                > AdaptivePlanningService.score(high,1,today));
    }

    private Map<String,Object> topic(){
        Map<String,Object> topic=new HashMap<>();
        topic.put("priority",20d);topic.put("mastery",40d);topic.put("attempts",1);
        topic.put("difficulty",3);topic.put("days_to_exam",40);topic.put("overdue_days",0);
        topic.put("review_due",false);return topic;
    }
}
