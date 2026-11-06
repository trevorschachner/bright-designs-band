/**
 * Puts a contact-form submission into Attio, the team's CRM, the moment it
 * arrives. One call, `syncSubmissionToAttio`, does all of it:
 *
 * - **Person:** found by email, or created with the submitted name. An
 *   existing person is never edited (Attio may know them better than the form).
 * - **Company:** linked when exactly one Attio company has the school's name.
 *   Never created: schools are curated by hand, and a typo would make a
 *   duplicate. The note says when no single match was found.
 * - **Deal (inquiries only):** a person with an open deal (any stage but
 *   Signed or Lost) gets the note on that deal instead of a second one.
 *   Otherwise a new deal "<School>: <Season>" at stage Lead, source
 *   "Website form", owned by `ownerEmail`. Guide downloads get no deal.
 * - **Note:** every field of the submission, including the page it was sent
 *   from, on the deal (or on the person when there is no deal).
 *
 * Never throws: the result says what happened, so the route can store it and
 * the form never fails because Attio did. Attribute and option names match the
 * workspace set up on 2026-10-04 (_context/topics/sales-and-crm.md).
 */

const API = 'https://api.attio.com/v2';
const REQUEST_TIMEOUT_MS = 8000;

/** Deal stages that end a deal; anything else counts as open. */
const CLOSED_STAGES = new Set(['Signed', 'Lost']);

/** Form service ids → Attio deal "Services" options. Unlisted ids go in the note only. */
const SERVICE_OPTIONS: Record<string, string> = {
  'wind-arranging': 'Winds',
  'music-arranging': 'Winds',
  percussion: 'Percussion',
  drill: 'Drill',
  'drill-design': 'Drill',
  choreography: 'Choreography',
  'program-coordination': 'Coordination',
  copyright: 'Copyright / licensing',
  'music-licensing': 'Copyright / licensing',
};

export type AttioSubmission = {
  kind: 'inquiry' | 'resource_download';
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  school?: string;
  role?: string;
  showInterest?: string;
  bandSize?: string;
  abilityLevel?: string;
  instrumentation?: string;
  services?: string[];
  message?: string;
  referralSource?: string;
  referralBandDirector?: string;
  /** Path the form was sent from, e.g. `/shows/hive-mind`. */
  pageUrl?: string;
  /** The page before that: an in-site path or an external URL. */
  referrerUrl?: string;
  submissionId?: number;
  /** Absolute site URL, for the admin link in the note. */
  siteUrl?: string;
};

export type AttioSyncResult =
  | { status: 'synced'; recordUrl: string | null }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

export type AttioDeps = {
  apiKey: string | undefined;
  /** Workspace member who owns new deals (Attio requires an owner). */
  ownerEmail: string;
  fetch?: typeof fetch;
  now?: Date;
};

type AttioRecord = {
  id: { record_id: string };
  web_url?: string;
  values: Record<string, Array<Record<string, unknown>>>;
};

class AttioError extends Error {}

/**
 * The marching season an inquiry is most likely for. Shows are written over
 * the winter and spring for the fall, so from September on people are asking
 * about next year.
 */
export function seasonFor(date: Date): string {
  const year = date.getFullYear();
  return String(date.getMonth() >= 8 ? year + 1 : year);
}

export function attioServices(services: string[] | undefined): string[] {
  return [...new Set((services ?? []).map((s) => SERVICE_OPTIONS[s]).filter((s): s is string => Boolean(s)))];
}

export async function syncSubmissionToAttio(
  submission: AttioSubmission,
  deps: AttioDeps
): Promise<AttioSyncResult> {
  if (!deps.apiKey) return { status: 'skipped', reason: 'ATTIO_API_KEY is not set' };
  const call = client(deps.apiKey, deps.fetch ?? fetch);
  try {
    const now = deps.now ?? new Date();
    const company = submission.school ? await findCompany(call, submission.school) : { id: null, matches: 0 };
    const person = await findOrCreatePerson(call, submission, company.id);

    let parent: { object: 'deals' | 'people'; record: AttioRecord } = { object: 'people', record: person };
    let dealNote = '';
    if (submission.kind === 'inquiry') {
      const open = await findOpenDeal(call, person.id.record_id);
      if (open) {
        parent = { object: 'deals', record: open };
        dealNote = 'Added to the open deal this person already had.';
      } else {
        parent = { object: 'deals', record: await createDeal(call, submission, person, company.id, deps.ownerEmail, now) };
      }
    }

    await call('POST', '/notes', {
      data: {
        parent_object: parent.object,
        parent_record_id: parent.record.id.record_id,
        title: noteTitle(submission),
        format: 'plaintext',
        content: noteBody(submission, company.matches, dealNote),
      },
    });
    return { status: 'synced', recordUrl: parent.record.web_url ?? person.web_url ?? null };
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

type Call = (method: 'GET' | 'POST', path: string, body?: unknown) => Promise<{ data: unknown }>;

function client(apiKey: string, fetchImpl: typeof fetch): Call {
  return async (method, path, body) => {
    const response = await fetchImpl(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Attio's error body names the attribute or option it rejected.
      const detail = await response.text().catch(() => '');
      throw new AttioError(`Attio ${method} ${path.split('?')[0]} → ${response.status}: ${detail.slice(0, 300)}`);
    }
    return (await response.json()) as { data: unknown };
  };
}

async function findCompany(call: Call, school: string): Promise<{ id: string | null; matches: number }> {
  const { data } = await call('POST', '/objects/companies/records/query', {
    filter: { name: { $eq: school } },
    limit: 2,
  });
  const rows = data as AttioRecord[];
  return { id: rows.length === 1 ? rows[0].id.record_id : null, matches: rows.length };
}

async function findOrCreatePerson(call: Call, s: AttioSubmission, companyId: string | null): Promise<AttioRecord> {
  const { data } = await call('POST', '/objects/people/records/query', {
    filter: { email_addresses: s.email },
    limit: 1,
  });
  const [existing] = data as AttioRecord[];
  if (existing) return existing;

  const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ');
  const values: Record<string, unknown> = {
    email_addresses: [s.email],
    name: [{ first_name: s.firstName, last_name: s.lastName, full_name: fullName || s.email }],
  };
  if (companyId) values.company = [{ target_object: 'companies', target_record_id: companyId }];
  const created = await call('POST', '/objects/people/records', { data: { values } });
  return created.data as AttioRecord;
}

async function findOpenDeal(call: Call, personId: string): Promise<AttioRecord | null> {
  const { data } = await call('POST', '/objects/deals/records/query', {
    filter: { associated_people: { target_object: 'people', target_record_id: personId } },
    sorts: [{ attribute: 'created_at', direction: 'desc' }],
    limit: 25,
  });
  const deals = data as AttioRecord[];
  return deals.find((deal) => !CLOSED_STAGES.has(stageTitle(deal))) ?? null;
}

function stageTitle(deal: AttioRecord): string {
  const status = deal.values.stage?.[0]?.status as { title?: string } | undefined;
  return status?.title ?? '';
}

async function createDeal(
  call: Call,
  s: AttioSubmission,
  person: AttioRecord,
  companyId: string | null,
  ownerEmail: string,
  now: Date
): Promise<AttioRecord> {
  const season = seasonFor(now);
  const who = s.school || [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email;
  const values: Record<string, unknown> = {
    name: `${who}: ${season}`,
    stage: 'Lead',
    owner: ownerEmail,
    source: 'Website form',
    associated_people: [{ target_object: 'people', target_record_id: person.id.record_id }],
  };
  // A season with no option yet (2028 before someone adds it) would reject
  // the whole deal; leave it off and let the name carry it.
  if (await hasOption(call, 'season', season)) values.season = season;
  const services = attioServices(s.services);
  if (services.length) values.services = services;
  if (s.showInterest?.startsWith('Show:')) values.deal_type = 'Resale';
  if (companyId) values.associated_company = [{ target_object: 'companies', target_record_id: companyId }];
  const created = await call('POST', '/objects/deals/records', { data: { values } });
  return created.data as AttioRecord;
}

async function hasOption(call: Call, attribute: string, title: string): Promise<boolean> {
  const { data } = await call('GET', `/objects/deals/attributes/${attribute}/options`);
  return (data as Array<{ title: string; is_archived: boolean }>).some((o) => o.title === title && !o.is_archived);
}

function noteTitle(s: AttioSubmission): string {
  return s.kind === 'resource_download' ? 'Website: guide download' : 'Website inquiry';
}

function noteBody(s: AttioSubmission, companyMatches: number, dealNote: string): string {
  const lines: Array<[string, string | undefined]> = [
    ['Message', s.message],
    ['Interested in', s.showInterest],
    ['School', s.school],
    ['Role', s.role],
    ['Band size', s.bandSize],
    ['Ability level', s.abilityLevel],
    ['Instrumentation / notes', s.instrumentation],
    ['Services', s.services?.join(', ')],
    ['Phone', s.phone],
    ['Heard about us', s.referralSource],
    ['Referred by', s.referralBandDirector],
    ['Sent from page', s.pageUrl],
    ['Came from', s.referrerUrl],
  ];
  const body = lines.filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v!.trim()}`);
  if (s.school && companyMatches !== 1) {
    body.push(
      companyMatches === 0
        ? `No Attio company is named "${s.school}"; link one by hand.`
        : `Several Attio companies are named "${s.school}"; link the right one by hand.`
    );
  }
  if (dealNote) body.push(dealNote);
  if (s.siteUrl) body.push(`Admin: ${s.siteUrl}/admin/inquiries`);
  return body.join('\n');
}
