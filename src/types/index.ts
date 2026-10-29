/**
 * HUMAN.exe — The Accountability Protocol
 * Type Definitions (v2.1 final)
 */

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Role = 'developer' | 'qa' | 'tech_lead';
export type Goal = 'validation' | 'risk' | 'privacy';

export interface UserProfile {
  level: Level | null;
  role: Role | null;
  goal: Goal | null;
}

export type DecisionId = 'D1' | 'D2' | 'D3';

export type OptionId =
  | 'D1_ROLLBACK_NOW'
  | 'D1_VERIFY_SCHEMA'
  | 'D2_SMOKE_TEST'
  | 'D2_DEPLOY_NOW'
  | 'D3_SHARE_RAW'
  | 'D3_REDACT_RESTRICT';

export type Flag = 'ARCH_RISK' | 'VERIFY_RISK' | 'PRIVACY_RISK';

export type Ending = 'SAFE_RECOVERY' | 'UNSAFE_RECOVERY';

export type SimState =
  | 'PROFILE'
  | 'D1_DECIDE'
  | 'D1_JUSTIFY'
  | 'D1_CONSEQUENCE'
  | 'D2_DECIDE'
  | 'D2_JUSTIFY'
  | 'D2_CONSEQUENCE'
  | 'D3_DECIDE'
  | 'D3_JUSTIFY'
  | 'D3_CONSEQUENCE'
  | 'REPORT';

export interface EvidenceCard {
  id: string;
  title: string;
  filename: string;
  category: 'code' | 'test' | 'policy';
  badge: string;
  content: string;
  codeSnippet?: string;
}

export interface DecisionOption {
  id: OptionId;
  text: string;
  timeCostMin: number;
  flag: Flag | null;
  isSafe: boolean;
}

export interface Justification {
  id: number;
  text: string;
  isAligned: boolean;
}

export interface ConsequenceDetail {
  title: string;
  description: string;
  clockResult: string;
  principle: string;
  definition?: string; // For beginner
  tradeoffQuestion?: string; // For advanced
}

export interface DecisionDefinition {
  id: DecisionId;
  number: number;
  title: string;
  subtitle: string;
  time: string;
  description: string;
  incidentFact: string;
  assistRecommendation: string;
  assistConfidence?: number;
  assistStatus: 'misleading' | 'accurate';
  evidenceCards: EvidenceCard[];
  options: DecisionOption[];
  justifications: Justification[]; // Ordered specifically per spec
  consequences: Record<string, ConsequenceDetail>;
  hintLadder: string[];
}

export interface DecisionRecord {
  decisionId: DecisionId;
  optionId: OptionId;
  optionText: string;
  justificationId: number;
  justificationText: string;
  isJustificationAligned: boolean;
  flagIncurred: Flag | null;
  consequenceText: string;
  principleText: string;
}

export interface SimulationContext {
  profile: UserProfile;
  state: SimState;
  currentClock: string;
  flags: Flag[];
  records: Partial<Record<DecisionId, DecisionRecord>>;
  hintStepsUsed: Record<DecisionId, number>;
}
