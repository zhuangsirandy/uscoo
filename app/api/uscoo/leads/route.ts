import { emailReady } from '@/lib/email-store';
import { assessmentLeadInputSchema, createAssessmentLead } from '@/lib/engagement-store';
import { failure, jsonBody, reply, sameOrigin } from '@/lib/case-store';

export const dynamic = 'force-dynamic';

export async function GET() { return reply({ emailAvailable: emailReady() }); }

export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = assessmentLeadInputSchema.parse(await jsonBody(req));
    const lead = await createAssessmentLead(req, input);
    return reply({ saved: true, lead }, 201);
  } catch (error) {
    return failure(error);
  }
}
