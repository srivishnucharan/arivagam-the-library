import { normalizeImportValue, normalizeMembershipType } from './App';

describe('CSV import normalization', () => {
  test('maps common membership aliases to supported Supabase values', () => {
    expect(normalizeMembershipType('Inlibrary')).toBe('inhouse');
    expect(normalizeMembershipType('Monthly Plan')).toBe('monthly');
    expect(normalizeMembershipType('Annual Fee')).toBe('annual');
  });

  test('normalizes branch values to the existing branch id when possible', () => {
    const branches = [{ id: 'BR001', name: 'Perungalathur Main' }];
    expect(normalizeImportValue('branch_id', 'BR001', branches)).toBe('BR001');
    expect(normalizeImportValue('branch_id', 'Perungalathur Main', branches)).toBe('BR001');
    expect(normalizeImportValue('branch_id', 'Unknown Branch', branches)).toBeNull();
  });
});
