package ai.gabarita.study;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

class EngagementServiceTest {
    @Test
    void convertsPostgresDateWithoutClassCastException() {
        LocalDate expected = LocalDate.of(2026, 8, 7);

        assertEquals(expected, EngagementService.localDate(java.sql.Date.valueOf(expected)));
        assertEquals(expected, EngagementService.localDate(expected));
        assertEquals(expected, EngagementService.localDate("2026-08-07"));
        assertNull(EngagementService.localDate(null));
    }

    @Test
    void skipsUnplannedWeekendsWhenFindingStreakDays() {
        Set<Integer> mondayToFriday=Set.of(1,2,3,4,5);

        assertEquals(LocalDate.of(2026,8,28),
                EngagementService.previousScheduledDate(LocalDate.of(2026,8,31),mondayToFriday));
        assertEquals(LocalDate.of(2026,8,31),
                EngagementService.nextScheduledDate(LocalDate.of(2026,8,29),mondayToFriday));
        assertEquals(false,EngagementService.isScheduled(LocalDate.of(2026,8,29),mondayToFriday));
    }
}
