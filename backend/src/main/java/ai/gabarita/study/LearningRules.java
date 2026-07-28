package ai.gabarita.study;

import java.time.LocalDate;

public final class LearningRules {
    private LearningRules() {}

    public static double mastery(double recentAccuracy, double historicalAccuracy, int attempts,
                                 int difficulty, long daysSinceStudy) {
        double confidence = Math.min(1d, attempts / 5d);
        double weighted = recentAccuracy * .55 + historicalAccuracy * .25
                + confidence * 15 + Math.max(0, difficulty - 1) * 1.25;
        double forgetting = Math.min(25, Math.max(0, daysSinceStudy) * 1.5);
        return clamp(weighted - forgetting, 0, 100);
    }

    public static double priority(double editalWeight, double frequency, double userDifficulty,
                                  long overdueDays, long daysToExam, double mastery) {
        double examUrgency = daysToExam <= 14 ? 25 : daysToExam <= 30 ? 15 : 5;
        return editalWeight * 2 + frequency * 2 + userDifficulty * 4
                + Math.min(30, Math.max(0, overdueDays) * 2) + examUrgency - mastery * .35;
    }

    public static int[] reviewIntervals(double accuracy) {
        if (accuracy < 70) return new int[]{1, 3, 7};
        if (accuracy >= 85) return new int[]{7, 21, 60};
        return new int[]{1, 7, 30};
    }

    public static boolean taskCompleted(int studiedSeconds, int plannedMinutes,
                                        int questionsAnswered, int questionGoal) {
        boolean timeReached = studiedSeconds >= plannedMinutes * 60;
        boolean questionsReached = questionGoal > 0 && questionsAnswered >= questionGoal;
        return timeReached && (questionGoal == 0 || questionsReached);
    }

    public static boolean validStreakDay(int studiedMinutes, int tasksCompleted, int questionsAnswered) {
        return studiedMinutes >= 30 || tasksCompleted >= 1 || questionsAnswered >= 10;
    }

    public static int levelForXp(int totalXp) {
        return Math.max(1, (int) Math.floor(Math.sqrt(Math.max(0, totalXp) / 150d)) + 1);
    }

    public static int xpForNextLevel(int level) {
        return level * level * 150;
    }

    public static LocalDate localDate(java.time.Instant instant, String timezone) {
        return instant.atZone(java.time.ZoneId.of(timezone)).toLocalDate();
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
