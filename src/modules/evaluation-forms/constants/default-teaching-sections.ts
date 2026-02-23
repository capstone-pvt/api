/**
 * Default evaluation form sections for teaching (PAA, KSM, TS, CM, AL, GO).
 * Required columns / section keys and their full names.
 */
export interface DefaultTeachingSection {
  key: string;
  title: string;
  items: string[];
}

export const DEFAULT_TEACHING_SECTIONS: DefaultTeachingSection[] = [
  {
    key: 'PAA',
    title: 'Professional Attitude & Appearance',
    items: [
      'Shows marked extraordinary enthusiasm about his/her teaching',
      "Endeavors to implement the school's objective",
      'Intellectually humble and tolerant',
      'Always clean and orderly in person, dress, and habits',
      'Well-modulated voice',
      'Capable of adjusting to changing conditions and situations',
      'Consistently alert and emotionally mature',
      'Punctual in class attendance/meetings and other school activities',
      'Follows school rules and regulations',
      'Performs other duties assigned outside of classroom work',
    ],
  },
  {
    key: 'KSM',
    title: 'Effectiveness of Teaching (Knowledge of Subject Matter)',
    items: [
      'Prepares lesson well',
      'Has ample understanding/grasp of subject',
      'Shows interest in subject matter',
      'Welcomes questions/requests/clarification',
      'Organizes subject matter well',
      'Selects relevant material effectively',
      'Ability to relate subject matter to other fields',
    ],
  },
  {
    key: 'TS',
    title: 'Teaching Skills',
    items: [
      'Speaks clearly and distinctly',
      'Speaks English-Filipino correctly',
      'Makes lesson interesting',
      'Explains subject matter clearly',
      'Makes subject matter relevant to the course objectives',
      'Makes subject matter relevant/practical to current needs',
      'Uses techniques for students participation',
      'Encourages critical thinking',
      'Provides appropriate drills/seatwork/assignments',
    ],
  },
  {
    key: 'CM',
    title: 'Classroom Management',
    items: [
      "Commands students' respect",
      'Handles individual/group discipline tactfully',
      'Fair in dealing with students',
      'Adopts a system in routine work',
    ],
  },
  {
    key: 'AL',
    title: 'Assessment of Learning',
    items: [
      'Assigns assessment that is related to subject/course material',
      'Allows enough time to complete the assigned assessment',
      'Give examinations that reflected the material covered in the delivery of instructions',
      'Provides constructive and timely feedbacks on graded material',
      'Grades the assigned assessment fairly by using rubrics',
      'Creative in developing activities and other formative assessments',
    ],
  },
  {
    key: 'GO',
    title: 'Goals & Overall Performance',
    items: [
      'Rapport between teachers and students',
      'Class participation',
      'Overall teacher impact',
      'General classroom condition',
    ],
  },
];
