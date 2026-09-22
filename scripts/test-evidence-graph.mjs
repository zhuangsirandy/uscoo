import assert from 'node:assert/strict';
import { validateEvidenceGraph } from '../lib/evidence-graph.ts';
import fixture from '../examples/fictional-founder-intake.json' with { type: 'json' };

const graph = fixture.evidenceGraph;
assert.deepEqual(validateEvidenceGraph(graph), []);
assert.equal(graph.assertions[0].status, 'unresolved');
assert.equal(graph.assertions[0].currentEffectiveVerificationId, undefined);
assert.equal(graph.verifications.length, 2);
console.log(
  'PASS Fictional graph preserves disagreeing verification activities',
);

const invalidGraph = structuredClone(graph);
invalidGraph.assertions[0].status = 'supported';
assert.match(
  validateEvidenceGraph(invalidGraph).join('\n'),
  /must remain unresolved/,
);
console.log(
  'PASS Conflicting verification results cannot be collapsed into supported',
);

const effectiveGraph = structuredClone(graph);
effectiveGraph.assertions[0].currentEffectiveVerificationId =
  'verification-independent-review';
effectiveGraph.assertions[0].effectiveReason =
  'Independent review has narrower scope and a dated source locator.';
effectiveGraph.assertions[0].effectiveAt = '2026-11-15T00:00:00Z';
assert.deepEqual(validateEvidenceGraph(effectiveGraph), []);
console.log(
  'PASS Current effective verification is explicit without deleting history',
);
