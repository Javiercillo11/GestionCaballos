import { useEffect, useMemo, useState } from 'react';
import type { SortDir } from '../components/ui';

export const PAGE_SIZE = 15;

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

export function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Ordenación y paginación en cliente para las tablas. */
export function useTable<T, K extends string>(
  rows: T[],
  getValue: (row: T, key: K) => string | number,
  initialKey: K,
  initialDir: SortDir = 'asc',
) {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : collator.compare(String(va), String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir, getValue]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const current = Math.min(page, pageCount);
  const pageRows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function onSort(key: K) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return { sortKey, sortDir, onSort, page: current, setPage, pageCount, pageRows, total: sorted.length };
}
