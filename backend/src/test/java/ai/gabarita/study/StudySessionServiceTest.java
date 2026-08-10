package ai.gabarita.study;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
}
