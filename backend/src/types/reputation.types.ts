export interface ICitationImpactRequest {
  standardCitations: number;
  highImpactCitations: number;
}

export interface IReputationResult {
  userId: number;
  impactScore: number;
  delta: number;
}

export interface IStandardEnvelope<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

export interface IScholarImpactCalculatedEvent {
  userId: number;
  standardCitations: number;
  highImpactCitations: number;
  newImpactScore: number;
  timestamp: string;
}
