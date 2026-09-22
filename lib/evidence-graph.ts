export type EvidenceBasis =
  | 'source-observed'
  | 'founder-statement'
  | 'model-inferred';
export type AssertionStatus =
  | 'unresolved'
  | 'supported'
  | 'contested'
  | 'superseded';
export type VerificationResult = 'supports' | 'contradicts' | 'inconclusive';
export type AssertionRelation = 'supports' | 'contradicts' | 'supersedes';

export type SourceArtifact = {
  id: string;
  uri?: string;
  stableLocator?: string;
  contentDigest?: string;
  producer?: string;
  observedAt?: string;
  publishedAt?: string;
  extractionMethod?: string;
  extractionVersion?: string;
  schemaVersion?: string;
  importRunId?: string;
  redactionStatus?: 'not-reviewed' | 'reviewed' | 'redacted';
  chainOfCustody?: string;
};

export type Observation = {
  id: string;
  sourceId: string;
  locator?: string;
  value: unknown;
  observedAt: string;
  observedBy?: string;
  method?: string;
};

export type Assertion = {
  id: string;
  subject: string;
  predicate: string;
  object: unknown;
  basis: EvidenceBasis;
  observationIds?: string[];
  status: AssertionStatus;
  currentEffectiveVerificationId?: string;
  effectiveReason?: string;
  effectiveAt?: string;
};

export type VerificationActivity = {
  id: string;
  assertionId: string;
  verifier: string;
  method: string;
  policyOrCriterion?: string;
  result: VerificationResult;
  verifiedAt: string;
  scope?: string;
  limitations?: string[];
};

export type AssertionRelationRecord = {
  fromAssertionId: string;
  toAssertionId: string;
  relation: AssertionRelation;
  reason?: string;
  effectiveAt?: string;
};

export type EvidenceGraph = {
  schemaVersion: '0.2';
  sources: SourceArtifact[];
  observations: Observation[];
  assertions: Assertion[];
  verifications: VerificationActivity[];
  relations: AssertionRelationRecord[];
};

function uniqueIds(items: { id: string }[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.id) errors.push(`${label} has an empty id`);
    if (seen.has(item.id)) errors.push(`${label} id is duplicated: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

/**
 * Validate the additive v0.2 graph without changing the legacy records model.
 * An empty error list means the graph is structurally valid, not legally sufficient.
 */
export function validateEvidenceGraph(graph: EvidenceGraph): string[] {
  const errors: string[] = [];
  if (graph.schemaVersion !== '0.2') errors.push('schemaVersion must be 0.2');

  const sourceIds = uniqueIds(graph.sources, 'source', errors);
  const observationIds = uniqueIds(graph.observations, 'observation', errors);
  const assertionIds = uniqueIds(graph.assertions, 'assertion', errors);
  const verificationIds = uniqueIds(
    graph.verifications,
    'verification',
    errors,
  );

  for (const observation of graph.observations) {
    if (!sourceIds.has(observation.sourceId)) {
      errors.push(
        `observation ${observation.id} references missing source ${observation.sourceId}`,
      );
    }
  }

  for (const assertion of graph.assertions) {
    for (const observationId of assertion.observationIds ?? []) {
      if (!observationIds.has(observationId)) {
        errors.push(
          `assertion ${assertion.id} references missing observation ${observationId}`,
        );
      }
    }
    if (assertion.currentEffectiveVerificationId) {
      const verification = graph.verifications.find(
        (item) => item.id === assertion.currentEffectiveVerificationId,
      );
      if (!verification) {
        errors.push(
          `assertion ${assertion.id} references missing effective verification ${assertion.currentEffectiveVerificationId}`,
        );
      } else if (verification.assertionId !== assertion.id) {
        errors.push(
          `effective verification ${verification.id} belongs to another assertion`,
        );
      }
      if (!assertion.effectiveReason || !assertion.effectiveAt) {
        errors.push(
          `assertion ${assertion.id} needs effectiveReason and effectiveAt`,
        );
      }
    }
  }

  for (const verification of graph.verifications) {
    if (!assertionIds.has(verification.assertionId)) {
      errors.push(
        `verification ${verification.id} references missing assertion ${verification.assertionId}`,
      );
    }
  }

  for (const relation of graph.relations) {
    if (!assertionIds.has(relation.fromAssertionId)) {
      errors.push(
        `relation references missing assertion ${relation.fromAssertionId}`,
      );
    }
    if (!assertionIds.has(relation.toAssertionId)) {
      errors.push(
        `relation references missing assertion ${relation.toAssertionId}`,
      );
    }
    if (relation.fromAssertionId === relation.toAssertionId) {
      errors.push(
        `relation cannot connect assertion ${relation.fromAssertionId} to itself`,
      );
    }
  }

  // This makes disagreement explicit instead of silently converting it to confidence.
  for (const assertion of graph.assertions) {
    const results = new Set(
      graph.verifications
        .filter((item) => item.assertionId === assertion.id)
        .map((item) => item.result),
    );
    if (
      results.has('supports') &&
      results.has('contradicts') &&
      assertion.status !== 'unresolved'
    ) {
      errors.push(
        `assertion ${assertion.id} must remain unresolved while verifications disagree`,
      );
    }
  }

  return errors;
}
