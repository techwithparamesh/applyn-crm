/**
 * Parses a CSV string into rows of key-value objects.
 */
export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
    rows.push(row);
  }

  return { headers, rows };
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Validates a record row against field definitions.
 */
export interface ValidationError {
  field: string;
  message: string;
}

export interface FieldDef {
  fieldKey: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
}

export function validateRow(row: Record<string, any>, fields: FieldDef[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const val = row[field.fieldKey];

    // Required check
    if (field.isRequired && (!val || String(val).trim() === '')) {
      errors.push({ field: field.fieldKey, message: `${field.label} is required` });
      continue;
    }

    if (!val || String(val).trim() === '') continue;

    const strVal = String(val).trim();

    // Type-specific validation
    switch (field.fieldType) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
          errors.push({ field: field.fieldKey, message: `Invalid email format: ${strVal}` });
        }
        break;
      case 'phone':
        if (!/^[\d\s\-\+\(\)]{7,20}$/.test(strVal)) {
          errors.push({ field: field.fieldKey, message: `Invalid phone format: ${strVal}` });
        }
        break;
      case 'number':
      case 'currency':
        if (isNaN(Number(strVal.replace(/[$,]/g, '')))) {
          errors.push({ field: field.fieldKey, message: `${field.label} must be a number` });
        }
        break;
      case 'date':
        if (isNaN(Date.parse(strVal))) {
          errors.push({ field: field.fieldKey, message: `Invalid date format: ${strVal}` });
        }
        break;
    }
  }

  return errors;
}

/**
 * Generates CSV string from records.
 */
export function generateCSV(headers: string[], rows: Record<string, any>[]): string {
  const escape = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

/**
 * Triggers browser download of a string as a file.
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Auto-maps CSV columns to CRM fields using fuzzy matching.
 */
export function autoMapColumns(csvHeaders: string[], fields: FieldDef[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const csvCol of csvHeaders) {
    const normalized = csvCol.toLowerCase().replace(/[_\-\s]/g, '');

    // Exact match
    let match = fields.find(f =>
      f.fieldKey.toLowerCase().replace(/[_\-\s]/g, '') === normalized ||
      f.label.toLowerCase().replace(/[_\-\s]/g, '') === normalized
    );

    // Partial match
    if (!match) {
      match = fields.find(f =>
        normalized.includes(f.fieldKey.toLowerCase().replace(/[_\-\s]/g, '')) ||
        f.fieldKey.toLowerCase().replace(/[_\-\s]/g, '').includes(normalized)
      );
    }

    if (match) {
      mapping[csvCol] = match.fieldKey;
    }
  }

  return mapping;
}
