export type Severity = "error" | "warning";

export interface SourceSpan {
  start: number;
  end: number;
  line: number;
  column: number;
}

export interface Diagnostic {
  code: string;
  severity: Severity;
  message: string;
  span?: SourceSpan;
  related?: Array<{ message: string; span?: SourceSpan }>;
}

export interface PragmaDefinition {
  id: string;
  aliases: string[];
  kind: "persona" | "technical";
  displayName: string;
  handle: string | null;
  gesture: string;
  requiresTake: boolean;
  rules: RequirementRule[];
  errorCode: string;
  errorMessage: string;
  refuses: string[];
  voice: string;
  quote: string;
}

export interface RequirementRule {
  id: string;
  options?: Record<string, unknown>;
}

export interface Registry {
  version: string;
  pragmas: PragmaDefinition[];
  conflicts: Array<[string, string]>;
}

export interface SocialArtifact {
  schemaVersion: 1;
  compilerVersion: string;
  pragmas: string[];
  takes: Array<{ text: string; quoteTweet: string }>;
  easterEggs: string[];
}
