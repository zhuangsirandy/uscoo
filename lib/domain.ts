export type EvidenceStatus = 'unverified' | 'verified' | 'insufficient' | 'superseded';
export type CriterionId = 'awards'|'membership'|'published_material'|'judging'|'original_contribution'|'scholarly_authorship'|'critical_role'|'high_remuneration';
export type AnswerValue = boolean | number | string | string[] | null;

export interface AssessmentQuestion { id:string; section:string; prompt:string; helpText?:string; answerType:'boolean'|'single'|'multi'|'number'|'text'|'date'; options?:string[]; criterionIds:CriterionId[]; weight:number; required:boolean; evidencePrompts:string[]; }
export interface AssessmentAnswer { questionId:string; value:AnswerValue; confidence:'low'|'medium'|'high'; sourceIds:string[]; updatedAt:string; }
export interface FounderFact { id:string; subjectId:string; predicate:string; value:string|number|boolean; timeframe?:{start?:string;end?:string}; sourceIds:string[]; confidence:number; status:'asserted'|'verified'|'disputed'; }
export interface EvidenceSource { id:string; title:string; sourceType:'document'|'url'|'testimony'|'record'; uri?:string; issuer?:string; date?:string; independent:boolean; status:EvidenceStatus; version:number; checksum?:string; }
export interface Claim { id:string; criterionId:CriterionId; statement:string; factIds:string[]; sourceIds:string[]; strength:number; issues:string[]; status:'candidate'|'substantiated'|'needs_review'; }
export interface DocumentArtifact { id:string; type:'evidence_index'|'petition_letter'|'business_plan'|'form'|'filing_packet'; version:string; status:'draft'|'reviewed'|'canonical'|'filed'|'superseded'; sourceIds:string[]; createdAt:string; frozenAt?:string; }
export interface TrackTask { id:string; track:'company'|'o1a'; stage:string; title:string; status:'locked'|'ready'|'in_progress'|'blocked'|'complete'; dependencies:string[]; evidenceIds:string[]; owner:'founder'|'uscoo'|'advisor'; }

export const readinessWeights = {coverage:.30,quality:.25,independence:.15,verification:.15,consistency:.10,recency:.05} as const;
export function readinessScore(input:Record<keyof typeof readinessWeights,number>) { return Math.round(Object.entries(readinessWeights).reduce((sum,[key,weight])=>sum+input[key as keyof typeof input]*weight,0)); }
