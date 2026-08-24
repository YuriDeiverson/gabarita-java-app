package ai.gabarita.admin;

public final class QuestionImportException extends IllegalArgumentException {
    private final int item;

    public QuestionImportException(int item, String message) {
        super("Questão " + item + ": " + message);
        this.item = item;
    }

    public int item() {
        return item;
    }
}
