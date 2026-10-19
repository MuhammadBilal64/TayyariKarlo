import type { Difficulty, Topic } from '@tayyari/shared';

const TOPIC_LABELS: Record<Topic, string> = {
  data_structures_algorithms: 'Data structures & algorithms',
  database_systems: 'Database systems',
  operating_systems: 'Operating systems',
  computer_networks: 'Computer networks',
  object_oriented_programming: 'Object-oriented programming',
  software_engineering: 'Software engineering',
  system_design: 'System design',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function topicLabel(topic: Topic) {
  return TOPIC_LABELS[topic];
}

export function difficultyLabel(difficulty: Difficulty) {
  return DIFFICULTY_LABELS[difficulty];
}

export function optionLetter(index: number) {
  return String.fromCharCode(65 + index);
}
