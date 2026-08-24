package ai.gabarita.study;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class StudySessionServiceTest {
    @Test
    void usesAnEmptyJsonObjectForFreeQuestionPractice() {
        assertEquals("{}",StudySessionService.questionPomodoroConfig(true,50,1));
    }

    @Test
    void keepsPomodoroConfigurationForTimedQuestionPractice() {
        assertEquals(
                "{\"focusMinutes\":25,\"shortBreakMinutes\":10,\"longBreakMinutes\":10,\"cycles\":4,\"targetCycles\":2}",
                StudySessionService.questionPomodoroConfig(false,25,2));
    }

    @Test
    void fixesStudyPomodoroAtOneFiftyMinuteCycle() {
        assertEquals(
                "{\"focusMinutes\":50,\"shortBreakMinutes\":10,\"longBreakMinutes\":10,\"cycles\":1,\"targetCycles\":1}",
                StudySessionService.studyPomodoroConfig());
    }

    @Test
    void onlyStartsTheAvailableTaskFromToday() {
        LocalDate today=LocalDate.of(2026,8,21);
        assertTrue(StudySessionService.canStartScheduledTask("AVAILABLE",today,today));
        assertTrue(StudySessionService.canStartScheduledTask("IN_PROGRESS",today,today));
        assertFalse(StudySessionService.canStartScheduledTask("PENDING",today,today));
        assertFalse(StudySessionService.canStartScheduledTask("AVAILABLE",today.minusDays(1),today));
        assertFalse(StudySessionService.canStartScheduledTask("COMPLETED",today,today));
    }
}
