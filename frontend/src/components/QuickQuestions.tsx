interface QuickQuestionsProps {
  onSelect: (question: string) => void;
  disabled: boolean;
  visible: boolean;
}

const QUICK_QUESTIONS = [
  "What jerseys do you have?",
  "What's your return policy?",
  "Do you ship to my city?",
  "Can I pay with UPI?",
  "How do I track my order?",
];

export function QuickQuestions({ onSelect, disabled, visible }: QuickQuestionsProps) {
  if (!visible) return null;

  return (
    <div className="quick-questions">
      <span className="quick-questions-label">Quick questions:</span>
      <div className="quick-questions-list">
        {QUICK_QUESTIONS.map((question, index) => (
          <button
            key={index}
            className="quick-question-chip"
            onClick={() => onSelect(question)}
            disabled={disabled}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
