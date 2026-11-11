import { useMemo, useState } from 'react'
import { findGaps, isBlank } from './planner'

// Pantalla per omplir, amb el client, el que falta per al planificador. Va per reunions:
//   1. Personal i màquines   2. Operacions comunes (una resposta val per a tots els productes)
//   3. Productes: primer el que es respon per família o per excepció, després producte per producte
// Cada resposta es desa directament a la base de dades i la pregunta desapareix.

const PROFILES = ['Directa', 'Directa formada', 'Manipuladora', 'Cocinero', 'Encarregat', 'Responsable de línia', 'Almacenero', 'Indirecte']
const SHIFTS = ['Mañana', 'Tarde', 'Noche', 'Partido']
const PER = [['fix', 'en total'], ['caixa', 'por caja'], ['palet', 'por palet'], ['carro', 'por carro'], ['kg', 'por kg'], ['unitat', 'por unidad'], ['bandeja', 'por bandeja'], ['container', 'por container']]
const FREQS = [['cada_produccio', 'Cada producción'], ['final_jornada', 'Final de jornada'], ['final_setmana', 'Final de semana'], ['altres', 'Otra']]

// Accepta "1,5" i "1.5"
const num = v => {
  const n = Number(String(v ?? '').trim().replace(',', '.'))
  return String(v ?? '').trim() === '' || Number.isNaN(n) ? null : n
}

function useSaver() {
  const [msg, setMsg] = useState('')
  const run = async (fn, ok) => {
    setMsg('Guardando…')
    const res = await fn()
    setMsg(res?.error ? `⚠ No se ha guardado: ${res.error}` : ok)
    if (!res?.error) setTimeout(() => setMsg(''), 2500)
  }
  return [msg, run]
}

/* ═══ Peces de formulari reutilitzades ═══ */
function TimeInputs({ v, set }) {
  return (
    <span className="row">
      <input className="n" placeholder="min" value={v.min ?? ''} onChange={e => set({ ...v, min: e.target.value })} />
      <span>a</span>
      <input className="n" placeholder="máx." value={v.max ?? ''} onChange={e => set({ ...v, max: e.target.value })} />
      <span>min</span>
      <select value={v.per || 'fix'} onChange={e => set({ ...v, per: e.target.value })}>{PER.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      {v.per && v.per !== 'fix' && <><span>cada</span><input className="n" placeholder="1" value={v.qty ?? ''} onChange={e => set({ ...v, qty: e.target.value })} /></>}
    </span>
  )
}
const timeValues = v => {
  const min = num(v.min), max = num(v.max) ?? min
  const per = v.per || 'fix'
  return { minuts_min: min ?? max, minuts_max: max, temps_unitat: per, temps_quantitat: per === 'fix' ? null : num(v.qty) ?? 1 }
}

function PeopleInputs({ v, set, onlyProfile }) {
  return (
    <span className="row">
      {!onlyProfile && <>
        <input className="n" placeholder="nº" value={v.n ?? ''} onChange={e => set({ ...v, n: e.target.value })} />
        <span>persona(s)</span>
      </>}
      <select value={v.profile || ''} onChange={e => set({ ...v, profile: e.target.value })}>
        <option value="">perfil…</option>
        {PROFILES.map(p => <option key={p}>{p}</option>)}
      </select>
      {!onlyProfile && <label className="chk"><input type="checkbox" checked={v.n === '0'} onChange={e => set({ ...v, n: e.target.checked ? '0' : '' })} /> nadie (va solo, o lo hace quien ya está en otro paso)</label>}
    </span>
  )
}
const peopleValues = v => num(v.n) === 0 ? { persones_necessaries: 0, perfils_de_persona: null } : { persones_necessaries: num(v.n), perfils_de_persona: v.profile || null }

/* ═══ 1. Personal i màquines ═══ */
function Staff({ profile, db }) {
  const [f, setF] = useState({ n: '', torn: 'Mañana', from: '06:00', to: '14:00', days: 'L-V' })
  const [msg, run] = useSaver()
  const groups = {}
  for (const t of profile.staff) {
    const k = `${t.torn || '—'} ${t.hora_inici || ''}–${t.hora_fi || ''}${t.comentaris ? ` · ${t.comentaris}` : ''}`
    ;(groups[k] = groups[k] || []).push(t)
  }
  const add = () => run(() => db.insertRows('torns', Array.from({ length: num(f.n) || 0 }, (_, i) => ({
    persona: `${profile.name} ${profile.staff.length + i + 1}`, tipus_personal: profile.name, torn: f.torn,
    hora_inici: f.from, hora_fi: f.to, actiu: 'Sí', comentaris: f.days ? `Días: ${f.days}` : null,
  }))), 'Añadido ✓')
  return (
    <div className={`card ${profile.done ? 'done' : ''}`}>
      <div className="head"><b>{profile.name}</b><span className="muted">aparece en {profile.products} productos</span>{profile.done && <span className="ok">✓</span>}</div>
      {Object.entries(groups).map(([k, rows]) => (
        <div key={k} className="row">
          <span>{rows.length} persona(s) · {k}</span>
          <button className="link" onClick={() => run(() => db.deleteIds('torns', rows.map(r => r.id)), 'Borrado')}>borrar</button>
        </div>
      ))}
      <div className="row">
        <input className="n" placeholder="nº" value={f.n} onChange={e => setF({ ...f, n: e.target.value })} />
        <span>personas, turno</span>
        <select value={f.torn} onChange={e => setF({ ...f, torn: e.target.value })}>{SHIFTS.map(s => <option key={s}>{s}</option>)}</select>
        <span>de</span><input type="time" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} />
        <span>a</span><input type="time" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} />
        <span>días</span><input className="m" value={f.days} onChange={e => setF({ ...f, days: e.target.value })} />
        <button disabled={!num(f.n)} onClick={add}>Añadir</button>
        <span className="msg">{msg}</span>
      </div>
    </div>
  )
}

function Machine({ l, uses, db }) {
  const [v, setV] = useState(l.quantitat ?? '')
  const [msg, run] = useSaver()
  const save = () => { if (num(v) !== (l.quantitat ?? null)) run(() => db.updateCell('linies', l.id, 'quantitat', num(v)), '✓') }
  return (
    <tr className={isBlank(l.quantitat) ? '' : 'done'}>
      <td>{l.linia}</td><td className="muted">{uses} productos</td>
      <td><input className="n" value={v} onChange={e => setV(e.target.value)} onBlur={save} onKeyDown={e => e.key === 'Enter' && e.target.blur()} /> <span className="msg">{msg}</span></td>
    </tr>
  )
}

function Meeting1({ g, data, db }) {
  const uses = useMemo(() => {
    const m = new Map()
    for (const f of data.flux) if (!isBlank(f.linia)) m.set(f.linia, (m.get(f.linia) || new Set()).add(f.producte))
    return m
  }, [data.flux])
  const machines = [...data.linies].sort((a, b) => (uses.get(b.linia)?.size || 0) - (uses.get(a.linia)?.size || 0))
  return (
    <>
      <p className="intro">Con el encargado o la persona que organiza los turnos. Para cada perfil: cuántas personas hay y en qué turno. Si un perfil tiene gente en dos turnos, añade una línea por turno.</p>
      <h3>Personal</h3>
      {g.profiles.map(p => <Staff key={p.name} profile={p} db={db} />)}
      <h3>Máquinas: ¿cuántas hay de cada una?</h3>
      <p className="muted">Escribe el número y pulsa Enter. Se guarda solo.</p>
      <table><thead><tr><th>Recurso</th><th>Lo usan</th><th>Cuántos hay</th></tr></thead>
        <tbody>{machines.map(l => <Machine key={l.id || l.linia} l={l} uses={uses.get(l.linia)?.size || 0} db={db} />)}</tbody>
      </table>
    </>
  )
}

/* ═══ 2. Operacions comunes ═══ */
function Operation({ op, data, db }) {
  const [t, setT] = useState({ per: 'fix' })
  const [pp, setP] = useState({})
  const [msg, run] = useSaver()
  const needsTime = op.ids.temps.length > 0
  const needsPeople = needsTime || op.ids.persones.length > 0
  const onlyProfile = !needsPeople && op.ids.perfil.length > 0
  const byId = useMemo(() => new Map(data.flux.map(f => [f.id, f])), [data.flux])

  const apply = () => run(async () => {
    if (needsTime && num(t.min) === null && num(t.max) === null) return { error: 'falta el tiempo' }
    if (needsTime) {
      const r = await db.updateRows('flux', op.ids.temps, timeValues(t))
      if (r.error) return r
    }
    if (onlyProfile) return db.updateRows('flux', op.ids.perfil, { perfils_de_persona: pp.profile || null })
    if (num(pp.n) === null) return { error: null }
    // Les persones només van on encara no n'hi ha
    const ids = [...new Set([...op.ids.temps, ...op.ids.persones])].filter(id => isBlank(byId.get(id)?.persones_necessaries))
    return db.updateRows('flux', ids, peopleValues(pp))
  }, 'Aplicado ✓')

  return (
    <div className="card">
      <div className="head"><b>{op.label}</b><span className="muted">{op.products.length} productos · falta {op.missing.map(w => ({ temps: 'tiempo', persones: 'personas', perfil: 'perfil' })[w]).join(', ')}</span></div>
      {needsTime && <div className="row"><span className="lbl">Tiempo</span><TimeInputs v={t} set={setT} /></div>}
      {(needsPeople || onlyProfile) && <div className="row"><span className="lbl">{onlyProfile ? 'Perfil' : 'Quién'}</span><PeopleInputs v={pp} set={setP} onlyProfile={onlyProfile} /></div>}
      <div className="row"><button onClick={apply}>Aplicar a los {op.products.length} productos</button><span className="msg">{msg}</span></div>
    </div>
  )
}

function Meeting2({ g, data, db }) {
  return (
    <>
      <p className="intro">Con el encargado de producción. Son operaciones que se hacen igual en casi todos los productos: una respuesta se aplica a todos los que no tienen el dato. Si en algún producto es distinto, se cambia después en ese producto.</p>
      {g.operations.length === 0 && <p className="ok">✓ Todas respondidas.</p>}
      {g.operations.map(op => <Operation key={op.key} op={op} data={data} db={db} />)}
    </>
  )
}

/* ═══ 3. Productes ═══ */
function Days({ g, db }) {
  const missing = g.products.filter(p => p.questions.some(q => q.on === 'dies_permesos'))
  const [ex, setEx] = useState({})
  const [msg, run] = useSaver()
  if (!missing.length) return <p className="ok">✓ Todos los productos tienen sus días.</p>
  const saveAll = () => run(async () => {
    for (const p of missing.filter(p => !isBlank(ex[p.id]))) {
      const r = await db.updateCell('productes', p.id, 'dies_permesos', ex[p.id].trim())
      if (r.error) return r
    }
    return db.updateRows('productes', missing.filter(p => isBlank(ex[p.id])).map(p => p.id), { dies_permesos: 'tots' })
  }, 'Guardado ✓')
  return (
    <div className="card">
      <p>¿Hay alguno de estos {missing.length} productos que <b>no</b> se pueda fabricar cualquier día? Escribe sus días (p. ej. «L-X-V»). Los que dejes vacíos quedarán como «todos los días».</p>
      <table><tbody>{missing.map(p => (
        <tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td><input className="m" placeholder="todos" value={ex[p.id] || ''} onChange={e => setEx({ ...ex, [p.id]: e.target.value })} /></td></tr>
      ))}</tbody></table>
      <div className="row"><button onClick={saveAll}>Guardar</button><span className="msg">{msg}</span></div>
    </div>
  )
}

function CartsByFamily({ g, data, db }) {
  const missing = g.products.filter(p => p.questions.some(q => q.on === 'unitats_per_carro'))
  const families = [...new Set(missing.map(p => p.family))]
  const [v, setV] = useState({})
  const [msg, run] = useSaver()
  if (!missing.length) return <p className="ok">✓ Todos los productos tienen sus unidades por carro.</p>
  // El que ja tenen els altres productes de la família, com a pista
  const known = fam => [...new Set(data.productes.filter(p => !isBlank(p.unitats_per_carro) && g.products.find(x => x.id === p.id)?.family === fam).map(p => p.unitats_per_carro))].slice(0, 6)
  const save = () => run(async () => {
    for (const p of missing) {
      const n = num(v[p.id]) ?? num(v[p.family])
      if (n === null) continue
      const r = await db.updateCell('productes', p.id, 'unitats_per_carro', n)
      if (r.error) return r
    }
    return { error: null }
  }, 'Guardado ✓')
  return (
    <div className="card">
      <p>Pon el número por familia y se aplica a todos sus productos. Si alguno es distinto, escríbelo en su línea.</p>
      {families.map(fam => (
        <div key={fam} className="fam">
          <div className="row"><b>{fam}</b><input className="n" placeholder="unidades" value={v[fam] || ''} onChange={e => setV({ ...v, [fam]: e.target.value })} />
            {known(fam).length > 0 && <span className="muted">los que ya lo tienen: {known(fam).join(', ')}</span>}</div>
          <table><tbody>{missing.filter(p => p.family === fam).map(p => (
            <tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td><input className="n" placeholder={v[fam] || ''} value={v[p.id] || ''} onChange={e => setV({ ...v, [p.id]: e.target.value })} /></td></tr>
          ))}</tbody></table>
        </div>
      ))}
      <div className="row"><button onClick={save}>Guardar</button><span className="msg">{msg}</span></div>
    </div>
  )
}

function Question({ q, product, db }) {
  const [v, setV] = useState({ per: 'fix' })
  const [msg, run] = useSaver()
  const tg = q.target
  const save = () => run(async () => {
    if (q.kind === 'temps') return db.updateRows('flux', tg.ids, timeValues(v))
    if (q.kind === 'persones') return db.updateRows('flux', tg.ids, peopleValues(v))
    if (q.kind === 'perfil') return db.updateRows('flux', tg.ids, { perfils_de_persona: v.profile || null })
    if (q.kind === 'frequencia') return db.updateRows('flux', tg.ids, { frequencia: v.freq || null })
    if (q.on === 'no_classificat') {
      // No es perd: passa als comentaris del producte
      const r = await db.updateCell('productes', product.id, 'comentaris', [product.comentaris, `Cifras de la grabación: ${product.no_classificat}`, v.text].filter(Boolean).join('. '))
      return r.error ? r : db.updateCell('productes', product.id, 'no_classificat', null)
    }
    const value = v.text ?? ''
    const isNum = /^(unitats|caixes|kg_)/.test(tg.field)
    const r = await db.updateCell('productes', product.id, tg.field, isNum ? num(value) : value.trim())
    if (r.error || !tg.field2) return r
    return db.updateCell('productes', product.id, tg.field2, num(v.text2))
  }, '✓')

  let input
  if (!tg) input = <span className="muted">Se hace desde la app (grabar o reprocesar).</span>
  else if (q.kind === 'temps') input = <TimeInputs v={v} set={setV} />
  else if (q.kind === 'persones') input = <PeopleInputs v={v} set={setV} />
  else if (q.kind === 'perfil') input = <PeopleInputs v={v} set={setV} onlyProfile />
  else if (q.kind === 'frequencia') input = <select value={v.freq || ''} onChange={e => setV({ ...v, freq: e.target.value })}><option value="">…</option>{FREQS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
  else if (q.on === 'no_classificat') input = <input className="l" placeholder="¿Qué son? (opcional)" value={v.text || ''} onChange={e => setV({ ...v, text: e.target.value })} />
  else input = <>
    <input className={tg.field2 ? 'm' : 'l'} placeholder={tg.field2 ? 'código (vacío si no lleva)' : ''} value={v.text || ''} onChange={e => setV({ ...v, text: e.target.value })} />
    {tg.field2 && <><input className="n" placeholder="kg/palet" value={v.text2 || ''} onChange={e => setV({ ...v, text2: e.target.value })} /></>}
  </>

  return (
    <li>
      <div>{q.q}</div>
      {tg && <div className="row">{input}<button onClick={save}>{q.on === 'no_classificat' ? 'Revisado' : 'Guardar'}</button><span className="msg">{msg}</span></div>}
      {!tg && <div className="row">{input}</div>}
    </li>
  )
}

function Meeting3({ g, data, db }) {
  const [sel, setSel] = useState('')
  const handledAbove = ['dies_permesos', 'unitats_per_carro']
  const rest = g.products.map(p => ({ ...p, questions: p.questions.filter(q => !handledAbove.includes(q.on)) })).filter(p => p.questions.length)
  const cur = rest.find(p => String(p.id ?? p.code) === sel) || rest[0]
  const row = cur && data.productes.find(p => p.id === cur.id)
  return (
    <>
      <p className="intro">Primero lo que se responde de golpe; después, producto por producto. Empezad por los que más fabricáis: el planificador puede arrancar con esos.</p>
      <h3>Días en que se puede fabricar</h3>
      <Days g={g} db={db} />
      <h3>Unidades por carro</h3>
      <CartsByFamily g={g} data={data} db={db} />
      <h3>Producto por producto</h3>
      {!cur ? <p className="ok">✓ No queda nada.</p> : <>
        <select className="prod" value={String(cur.id ?? cur.code)} onChange={e => setSel(e.target.value)}>
          {rest.map(p => <option key={p.id ?? p.code} value={String(p.id ?? p.code)}>{p.code || '(sin código)'} · {p.name} — {p.questions.length} pendiente(s)</option>)}
        </select>
        <ol className="qs">{cur.questions.map(q => <Question key={`${cur.id}-${q.on}-${q.kind}-${q.q}`} q={q} product={row || {}} db={db} />)}</ol>
      </>}
    </>
  )
}

export const COMPLETAR_CSS = `
  .inf .tabs { display: flex; gap: 6px; margin: 12px 0 18px; flex-wrap: wrap; }
  .inf .tabs button { font: inherit; padding: 8px 14px; border-radius: 8px; border: 1px solid #9fb0c2; background: #f6f8fa; cursor: pointer; }
  .inf .tabs button.on { background: #1a2330; color: #fff; border-color: #1a2330; }
  .inf .intro { background: #eef5ff; border-left: 4px solid #3b8eea; padding: 8px 12px; }
  .inf .card { border: 1px solid #c8d2dd; border-radius: 8px; padding: 10px 12px; margin: 8px 0; }
  .inf .card.done, .inf tr.done td { background: #f1faf3; }
  .inf .card .head { display: flex; gap: 10px; align-items: baseline; margin-bottom: 6px; }
  .inf .row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin: 4px 0; }
  .inf .lbl { width: 60px; font-weight: 600; }
  .inf input, .inf select { font: inherit; padding: 4px 6px; border: 1px solid #9fb0c2; border-radius: 5px; }
  .inf input.n { width: 64px; } .inf input.m { width: 140px; } .inf input.l { width: 320px; }
  .inf select.prod { width: 100%; max-width: 700px; padding: 6px; font-size: 14px; }
  .inf .card button, .inf .qs button, .inf .fam button { font: inherit; padding: 4px 12px; border-radius: 5px; border: 1px solid #1a2330; background: #1a2330; color: #fff; cursor: pointer; }
  .inf button:disabled { opacity: .4; cursor: default; }
  .inf button.link { background: none !important; color: #b42318 !important; border: none !important; text-decoration: underline; padding: 0 4px !important; }
  .inf .chk { display: flex; gap: 4px; align-items: center; color: #5a6878; }
  .inf .msg { color: #1d7a3a; font-size: 12px; }
  .inf .qs li { margin: 10px 0; padding-bottom: 8px; border-bottom: 1px solid #eef2f6; }
  .inf .fam { margin: 8px 0 12px; }
`

export default function Completar({ data, db }) {
  const [tab, setTab] = useState(1)
  const g = useMemo(() => findGaps(data), [data])
  const staffDone = g.profiles.filter(p => p.done).length
  const machinesDone = data.linies.filter(l => !isBlank(l.quantitat)).length
  const productLeft = g.products.reduce((n, p) => n + p.questions.length, 0)
  return (
    <>
      <h1>Rellenar datos para el planificador</h1>
      <p className="sub">Cada respuesta se guarda al momento y la pregunta desaparece. Se puede dejar a medias y seguir otro día.</p>
      <div className="tabs">
        <button className={tab === 1 ? 'on' : ''} onClick={() => setTab(1)}>1 · Personal y máquinas ({staffDone}/{g.profiles.length} perfiles, {machinesDone}/{data.linies.length} máquinas)</button>
        <button className={tab === 2 ? 'on' : ''} onClick={() => setTab(2)}>2 · Operaciones comunes ({g.operations.length} pendientes)</button>
        <button className={tab === 3 ? 'on' : ''} onClick={() => setTab(3)}>3 · Productos ({productLeft} pendientes)</button>
      </div>
      {tab === 1 && <Meeting1 g={g} data={data} db={db} />}
      {tab === 2 && <Meeting2 g={g} data={data} db={db} />}
      {tab === 3 && <Meeting3 g={g} data={data} db={db} />}
    </>
  )
}
