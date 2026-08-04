package ai.gabarita.plan;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class StudyPlanServiceTest {
    @Test
    void normalizesTheDateFormatsReturnedByJdbcDrivers() {
        var expected=LocalDate.of(2026,11,1);

        assertEquals(expected,StudyPlanService.localDate(expected));
        assertEquals(expected,StudyPlanService.localDate(java.sql.Date.valueOf(expected)));
        assertEquals(expected,StudyPlanService.localDate("2026-11-01"));
    }
}
