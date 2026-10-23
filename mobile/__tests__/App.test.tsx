import { colors } from '../src/theme';
import { formatDate, formatInr } from '../src/utils/format';

test('formats Indian currency', () => {
  expect(formatInr('2500.00')).toBe('₹2,500.00');
});

test('formats dates for reading', () => {
  expect(formatDate('2026-11-15')).toMatch(/2026/);
});

test('design tokens stay stable', () => {
  expect(colors.background).toBe('#F7F8FA');
  expect(colors.navy).toBe('#172554');
  expect(colors.emerald).toBe('#10B981');
  expect(colors.overdue).toBe('#EF4444');
  expect(colors.warning).toBe('#F59E0B');
});
