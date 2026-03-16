import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// ── Field mapping per diverse sorgenti ──────────────────────

const LINKEDIN_FIELD_MAP: Record<string, string> = {
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Email Address': 'email',
  'Company': 'company',
  'Position': 'job_title',
  'Connected On': '_connected_on',
  'URL': 'linkedin_url',
  'Phone Numbers': 'phone',
  'first_name': 'first_name',
  'last_name': 'last_name',
  'email_address': 'email',
  'company': 'company',
  'position': 'job_title',
};

const APOLLO_FIELD_MAP: Record<string, string> = {
  'First Name': 'first_name',
  'Last Name': 'last_name',
  'Email': 'email',
  'Organization Name': 'company',
  'Title': 'job_title',
  'Person Linkedin Url': 'linkedin_url',
  'Phone': 'phone',
  'City': '_city',
  'State': '_state',
  'Country': '_country',
  'Industry': '_industry',
  'Keywords': '_keywords',
  'Company Linkedin Url': '_company_linkedin',
  '# Employees': '_employees',
  'Annual Revenue': '_revenue',
  'first_name': 'first_name',
  'last_name': 'last_name',
  'email': 'email',
  'organization_name': 'company',
  'title': 'job_title',
  'linkedin_url': 'linkedin_url',
  'phone_number': 'phone',
  'city': '_city',
  'country': '_country',
};

const GENERIC_FIELD_MAP: Record<string, string> = {
  'nome': 'first_name',
  'cognome': 'last_name',
  'email': 'email',
  'azienda': 'company',
  'società': 'company',
  'ruolo': 'job_title',
  'posizione': 'job_title',
  'telefono': 'phone',
  'linkedin': 'linkedin_url',
  'città': '_city',
  'location': '_city',
  'name': '_full_name',
  'full name': '_full_name',
  'full_name': '_full_name',
};

// ── CSV Parser ──────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const firstLine = lines[0];
  const separator = firstLine.includes('\t') ? '\t' :
    firstLine.includes(';') ? ';' : ',';

  const headers = parseLine(firstLine, separator);
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line, separator);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').trim();
    });
    return row;
  }).filter(row => Object.values(row).some(v => v));

  return { headers, rows };
}

function parseLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === sep && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

// ── Detect source ───────────────────────────────────────────

function detectSource(headers: string[]): 'linkedin' | 'apollo' | 'generic' {
  const headerSet = new Set(headers.map(h => h.toLowerCase()));

  if (headerSet.has('connected on') || (headerSet.has('url') && headerSet.has('position'))) {
    return 'linkedin';
  }
  if (headerSet.has('organization name') || headerSet.has('person linkedin url') || headerSet.has('apollo')) {
    return 'apollo';
  }
  return 'generic';
}

// ── Map row to contact ──────────────────────────────────────

function mapRowToContact(
  row: Record<string, string>,
  headers: string[],
  source: 'linkedin' | 'apollo' | 'generic',
  defaultTags: string[]
): Record<string, any> | null {
  const fieldMap = source === 'linkedin' ? LINKEDIN_FIELD_MAP :
    source === 'apollo' ? APOLLO_FIELD_MAP : GENERIC_FIELD_MAP;

  const contact: Record<string, any> = {
    source,
    tags: [...defaultTags],
    relationship_type: 'prospect',
    sector_interests: [],
    geography_interests: [],
  };

  const extras: Record<string, string> = {};

  for (const [csvField, value] of Object.entries(row)) {
    if (!value) continue;

    let mappedField = fieldMap[csvField] || fieldMap[csvField.toLowerCase()];

    if (!mappedField) {
      const lower = csvField.toLowerCase().trim();
      for (const [key, mapped] of Object.entries(fieldMap)) {
        if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
          mappedField = mapped;
          break;
        }
      }
    }

    if (mappedField) {
      if (mappedField.startsWith('_')) {
        extras[mappedField] = value;
      } else {
        contact[mappedField] = value;
      }
    }
  }

  if (extras['_full_name'] && !contact.first_name) {
    const parts = extras['_full_name'].trim().split(/\s+/);
    contact.first_name = parts[0] || '';
    contact.last_name = parts.slice(1).join(' ') || '';
  }

  const locationParts = [extras['_city'], extras['_state'], extras['_country']].filter(Boolean);
  if (locationParts.length > 0) {
    contact.location = locationParts.join(', ');
  }

  if (extras['_industry']) {
    contact.sector_interests = [extras['_industry']];
  }

  if (extras['_keywords']) {
    const keywords = extras['_keywords'].split(/[,;|]/).map(k => k.trim()).filter(Boolean);
    contact.tags = [...contact.tags, ...keywords.slice(0, 5)];
  }

  if (!contact.first_name && !contact.last_name) return null;
  if (!contact.first_name) contact.first_name = '';
  if (!contact.last_name) contact.last_name = contact.first_name || 'N/A';
  if (!contact.first_name) contact.first_name = 'N/A';

  return contact;
}

// ── POST Handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    let csvText: string;
    let defaultTags: string[] = [];
    let defaultType: string = 'prospect';
    let skipDuplicates = true;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const options = formData.get('options') as string;

      if (!file) return NextResponse.json({ error: 'File richiesto' }, { status: 400 });

      csvText = await file.text();

      if (options) {
        const opts = JSON.parse(options);
        defaultTags = opts.tags || [];
        defaultType = opts.relationship_type || 'prospect';
        skipDuplicates = opts.skip_duplicates !== false;
      }
    } else {
      const body = await request.json();
      csvText = body.csv_text;
      defaultTags = body.tags || [];
      defaultType = body.relationship_type || 'prospect';
      skipDuplicates = body.skip_duplicates !== false;
    }

    if (!csvText) {
      return NextResponse.json({ error: 'CSV vuoto' }, { status: 400 });
    }

    const { headers, rows } = parseCSV(csvText);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Nessuna riga trovata nel CSV' }, { status: 400 });
    }

    const source = detectSource(headers);

    const contacts: Record<string, any>[] = rows
      .map(row => mapRowToContact(row, headers, source, defaultTags))
      .filter((c): c is Record<string, any> => c !== null)
      .map(c => ({
        ...c,
        relationship_type: defaultType,
        created_by: user.id,
      }));

    if (contacts.length === 0) {
      return NextResponse.json({
        error: 'Nessun contatto valido trovato. Verifica il formato del CSV.',
        detected_source: source,
        headers,
      }, { status: 400 });
    }

    let skipped = 0;
    let toInsert = contacts;

    if (skipDuplicates) {
      const emails = contacts.filter(c => c.email).map(c => c.email);
      const linkedins = contacts.filter(c => c.linkedin_url).map(c => c.linkedin_url);

      const { data: existingEmails } = await supabase
        .from('contacts')
        .select('email')
        .in('email', emails.length > 0 ? emails : ['__none__']);

      const { data: existingLinkedins } = await supabase
        .from('contacts')
        .select('linkedin_url')
        .in('linkedin_url', linkedins.length > 0 ? linkedins : ['__none__']);

      const existingEmailSet = new Set((existingEmails || []).map((e: any) => e.email));
      const existingLinkedinSet = new Set((existingLinkedins || []).map((e: any) => e.linkedin_url));

      toInsert = contacts.filter(c => {
        const isDuplicate =
          (c.email && existingEmailSet.has(c.email)) ||
          (c.linkedin_url && existingLinkedinSet.has(c.linkedin_url));
        if (isDuplicate) skipped++;
        return !isDuplicate;
      });
    }

    let imported = 0;
    const errors: string[] = [];
    const batchSize = 100;

    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('contacts')
        .insert(batch)
        .select('id');

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        imported += (data?.length || 0);
      }
    }

    return NextResponse.json({
      success: true,
      detected_source: source,
      total_rows: rows.length,
      valid_contacts: contacts.length,
      imported,
      skipped_duplicates: skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
