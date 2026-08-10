package ai.gabarita.study;

import static org.junit.jupiter.api.Assertions.*;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class LearningRulesTest {
    @Test void combinesTimeAndQuestionCriteria() {
        assertTrue(LearningRules.taskCompleted(30 * 60, 30, 10, 10));
        assertFalse(LearningRules.taskCompleted(10 * 60, 30, 10, 10));
        assertFalse(LearningRules.taskCompleted(30 * 60, 30, 4, 10));
        assertFalse(LearningRules.taskCompleted(10 * 60, 30, 4, 10));
        assertTrue(LearningRules.taskCompleted(30 * 60, 30, 0, 0));
    }

    @Test void adaptsSpacedReviewToPerformance() {
        assertArrayEquals(new int[]{1,3,7}, LearningRules.reviewIntervals(49));
        assertArrayEquals(new int[]{1,7,30}, LearningRules.reviewIntervals(75));
        assertArrayEquals(new int[]{7,21,60}, LearningRules.reviewIntervals(92));
    }

    @Test void masteryUsesConfidenceDifficultyAndForgetting() {
        double fresh = LearningRules.mastery(80,70,5,3,0);
        double forgotten = LearningRules.mastery(80,70,5,3,20);
        assertTrue(fresh > forgotten);
        assertTrue(fresh >= 0 && fresh <= 100);
    }

    @Test void nextTopicPriorityRewardsUrgencyWeaknessAndOverdueReview() {
        double urgentWeak = LearningRules.priority(10,8,5,7,10,35);
        double distantMastered = LearningRules.priority(10,8,2,0,100,90);
        assertTrue(urgentWeak > distantMastered);
    }

    @Test void streakRequiresTenCorrectAnswersAndUsesUserTimezone() {
        assertFalse(LearningRules.validStreakDay(0));
        assertFalse(LearningRules.validStreakDay(9));
        assertTrue(LearningRules.validStreakDay(10));
        assertEquals("2026-07-20", LearningRules.localDate(Instant.parse("2026-07-21T01:30:00Z"), "America/Maceio").toString());
    }

    @Test void levelsGrowProgressively() {
        assertEquals(1,LearningRules.levelForXp(0));
        assertEquals(2,LearningRules.levelForXp(150));
        assertTrue(LearningRules.xpForNextLevel(4)>LearningRules.xpForNextLevel(3));
    }
}
