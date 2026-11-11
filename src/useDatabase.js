import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const TABLE_MAP = {
  productes: 'productes',
  recepta: 'recepta',
  farcit: 'farcit',
  masses: 'masses',
  linies: 'linies',
  flux: 'flux',
  torns: 'torns',
  gravacions: 'gravacions',
  reprocessament: 'reprocessament',
}

// Fields that must never be sent to the DB
const META_FIELDS = ['_id', 'id', 'created_at', '_action', '_existingId']

// Camps que porten una LLISTA de codis separats per comes ("M0002, M0007"). En fusionar,
// aquests no es poden tractar com la resta: un producte va sumant masses i farcits en
// gravacions successives, i si només s'omplissin quan són buits la segona massa es perdria.
const LIST_FIELDS = {
  productes: ['codi_massa', 'codi_farcit'],
}

const splitList = v => String(v || '').split(/[,;]/).map(s => s.trim()).filter(Boolean)

// Unió de dues llistes de codis, conservant l'ordre existent i afegint només els nous
const mergeLists = (current, incoming) => {
  const out = splitList(current)
  const seen = new Set(out.map(c => c.toLowerCase()))
  for (const c of splitList(incoming)) {
    if (seen.has(c.toLowerCase())) continue
    out.push(c)
    seen.add(c.toLowerCase())
  }
  return out.join(', ')
}
const cleanRow = r => {
  const o = {}
  Object.entries(r).forEach(([k, v]) => {
    if (META_FIELDS.includes(k)) return
    // Empty strings and undefined → null so PostgreSQL numeric columns don't reject the row
    o[k] = (v === '' || v === undefined) ? null : v
  })
  return o
}

// Supabase retorna com a molt 1000 files per petició. Sense paginar, les files que
// passen d'aquest límit no arriben a l'app i Refer o la fusió no les veuen.
const PAGE_SIZE = 1000

const fetchAllRows = async table => {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    // L'id desempata les files inserides alhora, perquè cap fila salti de pàgina
    const { data: page, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) return { rows: [], error }
    rows.push(...page)
    if (page.length < PAGE_SIZE) return { rows, error: null }
  }
}

export function useDatabase() {
  const [data, setData] = useState(() => {
    const init = {}
    Object.keys(TABLE_MAP).forEach(k => init[k] = [])
    return init
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    if (!supabase) {
      try {
        const saved = localStorage.getItem('produccio_data')
        // Les dades desades abans poden no tenir totes les taules
        if (saved) setData(prev => ({ ...prev, ...JSON.parse(saved) }))
      } catch {}
      setLoading(false)
      return
    }

    const newData = {}
    for (const [key, table] of Object.entries(TABLE_MAP)) {
      const { rows, error } = await fetchAllRows(table)

      if (error) {
        console.error(`Error loading ${table}:`, error)
        newData[key] = []
      } else {
        newData[key] = rows || []
      }
    }
    setData(newData)
    setLoading(false)
  }

  // Insert rows into a specific table. Returns { inserted, error } so the UI can
  // report failures instead of them passing unnoticed.
  const insertRows = useCallback(async (tableKey, rows) => {
    if (!rows.length) return { inserted: [], error: null }

    const clean = rows.map(cleanRow)

    if (!supabase) {
      const withIds = clean.map((r, i) => ({ ...r, id: `local-${Date.now()}-${i}` }))
      setData(prev => {
        const next = { ...prev, [tableKey]: [...prev[tableKey], ...withIds] }
        try { localStorage.setItem('produccio_data', JSON.stringify(next)) } catch {}
        return next
      })
      return { inserted: withIds, error: null }
    }

    const { data: inserted, error } = await supabase
      .from(TABLE_MAP[tableKey])
      .insert(clean)
      .select()

    if (error) {
      console.error(`Insert error (${tableKey}):`, error)
      return { inserted: [], error: error.message || String(error) }
    }

    setData(prev => ({
      ...prev,
      [tableKey]: [...prev[tableKey], ...inserted],
    }))
    return { inserted, error: null }
  }, [])

  // Merge new data into an existing row — only fills fields that are currently empty/null.
  // Always reads the current row from Supabase (not from local state) to avoid stale-closure
  // issues when mergeRow is called multiple times in the same confirmAll loop.
  const mergeRow = useCallback(async (tableKey, rowId, newData) => {
    let existing

    if (supabase) {
      // Fetch the live row so we never work from a stale React state snapshot
      const { data: rows, error } = await supabase
        .from(TABLE_MAP[tableKey])
        .select('*')
        .eq('id', rowId)
        .limit(1)
      if (error || !rows?.length) {
        console.error(`Merge fetch error (${tableKey}):`, error)
        return null
      }
      existing = rows[0]
    } else {
      // Fallback for localStorage mode: read from current state via functional updater below
      existing = await new Promise(resolve => {
        setData(prev => { resolve(prev[tableKey]?.find(r => r.id === rowId) ?? null); return prev })
      })
      if (!existing) return null
    }

    const updates = {}
    Object.entries(newData).forEach(([k, v]) => {
      if (META_FIELDS.includes(k)) return
      const cur = existing[k]
      const isEmpty = cur === null || cur === undefined || cur === ''
      const hasVal = v !== null && v !== undefined && v !== ''
      if (!hasVal) return
      if (isEmpty) { updates[k] = v; return }
      // Camp de llista ja amb contingut: acumula els codis nous en lloc de deixar-ho igual
      if (LIST_FIELDS[tableKey]?.includes(k)) {
        const union = mergeLists(cur, v)
        if (union !== splitList(cur).join(', ')) updates[k] = union
      }
    })

    if (!Object.keys(updates).length) return existing // nothing new to fill in

    const merged = { ...existing, ...updates }

    if (supabase) {
      const { error } = await supabase
        .from(TABLE_MAP[tableKey])
        .update(updates)
        .eq('id', rowId)
      if (error) {
        console.error(`Merge error (${tableKey}):`, error)
        return null
      }
    }

    // Update local state after the DB write succeeds
    setData(prev => {
      const next = {
        ...prev,
        [tableKey]: prev[tableKey].map(r => r.id === rowId ? merged : r),
      }
      if (!supabase) {
        try { localStorage.setItem('produccio_data', JSON.stringify(next)) } catch {}
      }
      return next
    })

    return merged
  }, []) // no [data] dependency — we read live from Supabase instead

  // Update a single cell. Returns { error } so the UI can report failures.
  const updateCell = useCallback(async (tableKey, rowId, field, rawValue) => {
    // Empty string → null so PostgreSQL numeric columns don't reject the update
    const value = rawValue === '' ? null : rawValue
    setData(prev => {
      const rows = prev[tableKey].map(r =>
        (r.id === rowId) ? { ...r, [field]: value } : r
      )
      const next = { ...prev, [tableKey]: rows }
      if (!supabase) {
        try { localStorage.setItem('produccio_data', JSON.stringify(next)) } catch {}
      }
      return next
    })

    if (supabase) {
      const { error } = await supabase
        .from(TABLE_MAP[tableKey])
        .update({ [field]: value })
        .eq('id', rowId)

      if (error) {
        console.error(`Update error:`, error)
        return { error: error.message || String(error) }
      }
    }
    return { error: null }
  }, [])

  // Delete a row
  const deleteRow = useCallback(async (tableKey, rowId) => {
    setData(prev => {
      const next = { ...prev, [tableKey]: prev[tableKey].filter(r => r.id !== rowId) }
      if (!supabase) {
        try { localStorage.setItem('produccio_data', JSON.stringify(next)) } catch {}
      }
      return next
    })

    if (supabase) {
      const { error } = await supabase
        .from(TABLE_MAP[tableKey])
        .delete()
        .eq('id', rowId)

      if (error) console.error(`Delete error:`, error)
    }
  }, [])

  // Delete a set of rows by id, in a single request. L'estat local només canvia si la BD
  // ha acceptat l'esborrat, perquè qui crida pugui confiar en el resultat.
  const deleteIds = useCallback(async (tableKey, ids) => {
    if (!ids.length) return { error: null }

    if (supabase) {
      const { error } = await supabase
        .from(TABLE_MAP[tableKey])
        .delete()
        .in('id', ids)

      if (error) {
        console.error(`Delete error (${tableKey}):`, error)
        return { error: error.message || String(error) }
      }
    }

    setData(prev => {
      const next = { ...prev, [tableKey]: prev[tableKey].filter(r => !ids.includes(r.id)) }
      if (!supabase) {
        try { localStorage.setItem('produccio_data', JSON.stringify(next)) } catch {}
      }
      return next
    })
    return { error: null }
  }, [])

  // Desa els mateixos valors a moltes files alhora (una resposta que val per a molts passos)
  const updateRows = useCallback(async (tableKey, ids, values) => {
    if (!ids.length) return { error: null }
    const clean = cleanRow(values)
    if (supabase) {
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await supabase.from(TABLE_MAP[tableKey]).update(clean).in('id', ids.slice(i, i + 200))
        if (error) {
          console.error(`Update error:`, error)
          return { error: error.message || String(error) }
        }
      }
    }
    const set = new Set(ids)
    setData(prev => {
      const next = { ...prev, [tableKey]: prev[tableKey].map(r => set.has(r.id) ? { ...r, ...clean } : r) }
      if (!supabase) {
        try { localStorage.setItem('produccio_data', JSON.stringify(next)) } catch {}
      }
      return next
    })
    return { error: null }
  }, [])

  return { data, loading, insertRows, mergeRow, updateCell, updateRows, deleteRow, deleteIds, reload: loadAll }
}
