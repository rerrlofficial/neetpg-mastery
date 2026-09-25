export type QuestionOption = {
  id: string;
  text: string;
};

export type MCQQuestion = {
  id?: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  unit?: string;
  subunit?: string;
  topic?: string;
};

export const requiredQuestionFields = [
  "question",
  "options",
  "correctAnswer",
] as const;
