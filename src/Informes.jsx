import { useMemo } from 'react'
import { useDatabase } from './useDatabase'
import { findGaps, stepsOf, isBlank } from './planner'

// Vistes de només lectura per lliurar al client, en castellà i pensades per imprimir:
//   ?vista=pendientes → el que falta omplir perquè el planificador funcioni
//   ?vista=catalogo   → la fitxa de cada producte, també descarregable en Excel

const FREQ = { cada_produccio: 'Cada producción', final_jornada: 'Final de jornada', final_setmana: 'Final de semana', altres: 'Otra' }
const UNIT = { fix: '', kg: 'kg', unitat: 'unidades', caixa: 'cajas', carro: 'carros', container: 'containers', bandeja: 'bandejas', palet: 'palets' }

const PRODUCT_COLUMNS = [
  ['producte', 'Código'], ['grup', 'Nombre'], ['unitats_per_palet', 'Unidades / palet'], ['caixes_per_palet', 'Cajas / palet'],
  ['unitats_per_caixa', 'Unidades / caja'], ['unitats_per_carro', 'Unidades / carro'], ['codi_massa', 'Masa'],
  ['kg_massa_palet', 'Kg masa / palet'], ['codi_farcit', 'Relleno'], ['kg_farcit_palet', 'Kg relleno / palet'],
  ['dies_permesos', 'Días permitidos'], ['linies_permeses', 'Líneas permitidas'], ['incompatible_amb', 'Incompatible con'],
  ['basat_en', 'Basado en'], ['comentaris', 'Comentarios'],
]
const RECIPE_COLUMNS = [
  ['producte', 'Producto'], ['codi_farcit', 'Relleno'], ['kg_farcit_palet', 'Kg relleno / palet'], ['grams_per_unitat_farcit', 'g relleno / unidad'],
  ['merma_farcit', 'Merma relleno'], ['codi_massa', 'Masa'], ['kg_massa_palet', 'Kg masa / palet'], ['grams_per_unit_massa', 'g masa / unidad'],
  ['merma_massa', 'Merma masa'], ['comentaris', 'Comentarios'],
]
const STEP_COLUMNS = [
  ['producte', 'Producto'], ['dia', 'Día'], ['pas', 'Paso'], ['accio', 'Acción'], ['codi_intervinent', 'Código'], ['linia', 'Recurso'],
  ['massa', 'Kg'], ['temps_per_kg', 'Tiempo dictado'], ['minuts_min', 'Min. mínimo'], ['minuts_max', 'Min. máximo'],
  ['temps_quantitat', 'Por cantidad'], ['temps_unitat', 'Unidad'], ['persones_necessaries', 'Personas'], ['perfils_de_persona', 'Perfil'],
  ['es_pot_parar', 'Se puede parar'], ['frequencia', 'Frecuencia'], ['minuts_abans_produccio', 'Min. antes de producción'],
  ['depen_de_pas', 'Depende del paso'], ['alternativa_de', 'Alternativa del paso'], ['comentaris', 'Comentarios'],
]
const COMPOSITION_COLUMNS = code => [[code, 'Código'], ['codi_nom_mp', 'Materia prima'], ['kg_per_palet', 'Kg / palet'], ['merma', 'Merma']]
const RESOURCE_COLUMNS = [['linia', 'Recurso'], ['tipus', 'Tipo'], ['quantitat', 'Cantidad'], ['descripcio', 'Descripción'], ['comentaris', 'Comentarios']]

const dayLabel = d => isBlank(d) || Number(d) === 0 ? 'Día D' : `D${Number(d) > 0 ? '+' : ''}${d}`

function timeLabel(rows) {
  const r = rows.find(x => !isBlank(x.minuts_min) || !isBlank(x.minuts_max))
  if (!r) return rows.find(x => !isBlank(x.temps_per_kg))?.temps_per_kg || '—'
  const span = isBlank(r.minuts_max) || r.minuts_min === r.minuts_max ? `${r.minuts_min ?? r.minuts_max}` : `${r.minuts_min ?? '?'}–${r.minuts_max}`
  const per = r.temps_unitat && r.temps_unitat !== 'fix' ? ` / ${r.temps_quantitat ?? 1} ${UNIT[r.temps_unitat] || r.temps_unitat}` : ''
  return `${span} min${per}`
}

const uniq = values => [...new Set(values.filter(v => !isBlank(v)))]

function peopleLabel(rows) {
  const n = uniq(rows.map(r => r.persones_necessaries))
  const p = uniq(rows.map(r => r.perfils_de_persona))
  if (!n.length && !p.length) return '—'
  if (n.length && Number(n[0]) === 0) return 'Nadie (va solo)'
  return [n.join(' / '), p.join(' / ')].filter(Boolean).join(' · ')
}

/* ═══ Excel (SpreadsheetML 2003: s'obre a Excel sense cap llibreria) ═══ */
const xmlEscape = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function sheet(name, columns, rows) {
  const cell = v => isBlank(v) ? '<Cell/>'
    : typeof v === 'number' || (/^-?\d+(\.\d+)?$/.test(String(v)) && String(v).length < 15 && !/^0\d/.test(String(v)))
      ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
      : `<Cell><Data ss:Type="String">${xmlEscape(v)}</Data></Cell>`
  const header = `<Row>${columns.map(([, label]) => `<Cell ss:StyleID="h"><Data ss:Type="String">${xmlEscape(label)}</Data></Cell>`).join('')}</Row>`
  const body = rows.map(r => `<Row>${columns.map(([key]) => cell(key === 'frequencia' ? FREQ[r[key]] || r[key] : r[key])).join('')}</Row>`).join('')
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${header}${body}</Table></Worksheet>`
}

function downloadExcel(data) {
  const byCode = (a, b) => String(a.producte || '').localeCompare(String(b.producte || ''), undefined, { numeric: true })
  const steps = [...data.flux].sort((a, b) => byCode(a, b) || (Number(a.dia) || 0) - (Number(b.dia) || 0) || (Number(a.pas) || 0) - (Number(b.pas) || 0))
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="h"><Font ss:Bold="1"/><Interior ss:Color="#DDE6F0" ss:Pattern="Solid"/></Style></Styles>
${sheet('Productos', PRODUCT_COLUMNS, [...data.productes].sort(byCode))}
${sheet('Recetas', RECIPE_COLUMNS, [...data.recepta].sort(byCode))}
${sheet('Pasos', STEP_COLUMNS, steps)}
${sheet('Rellenos', COMPOSITION_COLUMNS('codi_farcit'), data.farcit)}
${sheet('Masas', COMPOSITION_COLUMNS('codi_massa'), data.masses)}
${sheet('Recursos', RESOURCE_COLUMNS, data.linies)}
</Workbook>`
  const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.ms-excel' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `catalogo_productos_${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

/* ═══ Estils: paper blanc, que s'imprimeixi bé ═══ */
const CSS = `
  body { margin: 0; background: #fff; }
  .inf { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1a2330; font-size: 13px; line-height: 1.45; max-width: 1100px; margin: 0 auto; padding: 24px 32px 60px; }
  .inf h1 { font-size: 24px; margin: 0 0 4px; }
  .inf h2 { font-size: 18px; margin: 32px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #1a2330; }
  .inf h3 { font-size: 15px; margin: 22px 0 6px; }
  .inf .sub { color: #5a6878; margin: 0 0 16px; }
  .inf table { border-collapse: collapse; width: 100%; margin: 6px 0 12px; }
  .inf th, .inf td { border: 1px solid #c8d2dd; padding: 4px 6px; text-align: left; vertical-align: top; }
  .inf th { background: #eef2f6; font-weight: 600; }
  .inf td.ans { width: 28%; }
  .inf .bar { position: sticky; top: 0; background: #fff; display: flex; gap: 8px; align-items: center; padding: 10px 0; border-bottom: 1px solid #c8d2dd; margin-bottom: 16px; z-index: 1; }
  .inf .bar a, .inf .bar button { font: inherit; padding: 6px 12px; border-radius: 6px; border: 1px solid #9fb0c2; background: #f6f8fa; color: #1a2330; text-decoration: none; cursor: pointer; }
  .inf .bar a.on { background: #1a2330; color: #fff; border-color: #1a2330; }
  .inf .bar .sp { flex: 1; }
  .inf .stats { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
  .inf .stat { border: 1px solid #c8d2dd; border-radius: 8px; padding: 8px 14px; min-width: 120px; }
  .inf .stat b { display: block; font-size: 22px; }
  .inf .prod { break-inside: avoid; }
  .inf .ok { color: #1d7a3a; }
  .inf .muted { color: #5a6878; }
  .inf ol { margin: 4px 0 8px; padding-left: 22px; }
  .inf ol li { margin: 3px 0; }
  .inf ol li .line { display: block; border-bottom: 1px dotted #9fb0c2; height: 18px; margin-right: 20%; }
  .inf .ficha { break-before: page; }
  .inf .idx { columns: 3; font-size: 12px; }
  .inf .idx a { color: #1a2330; }
  @media print {
    .inf { padding: 0; max-width: none; font-size: 11px; }
    .inf .bar { display: none; }
    .inf h2 { break-after: avoid; }
    .inf a { text-decoration: none; }
  }
`

function Bar({ vista, data }) {
  return (
    <div className="bar">
      <a href="?vista=pendientes" className={vista === 'pendientes' ? 'on' : ''}>Pendientes de rellenar</a>
      <a href="?vista=catalogo" className={vista === 'catalogo' ? 'on' : ''}>Catálogo de productos</a>
      <span className="sp" />
      {vista === 'catalogo' && <button onClick={() => downloadExcel(data)}>⬇ Descargar Excel</button>}
      <button onClick={() => window.print()}>🖨 Imprimir / PDF</button>
    </div>
  )
}

const today = () => new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

function Pendientes({ data }) {
  const g = useMemo(() => findGaps(data), [data])
  const withQuestions = g.products.filter(p => p.questions.length)
  const complete = g.products.filter(p => !p.questions.length)
  const WHAT = { temps: 'tiempo', persones: 'personas', perfil: 'perfil' }

  return (
    <>
      <h1>Datos pendientes para el planificador</h1>
      <p className="sub">Generado el {today()} a partir de los datos actuales. Cada pregunta corresponde a un dato que el planificador necesita y que las grabaciones no dicen.</p>

      <div className="stats">
        <div className="stat"><b>{g.products.length}</b>productos</div>
        <div className="stat"><b>{complete.length}</b>completos</div>
        <div className="stat"><b>{g.operations.length}</b>operaciones comunes</div>
        <div className="stat"><b>{g.resources.length}</b>recursos sin cantidad</div>
        <div className="stat"><b>{withQuestions.reduce((n, p) => n + p.questions.length, 0)}</b>preguntas por producto</div>
      </div>

      <h2>1. Personal y turnos</h2>
      {g.noStaff
        ? <p>Todavía no hay ninguna persona registrada. Para cada perfil necesitamos cuántas personas hay, en qué turno trabajan (hora de inicio y fin) y qué días.</p>
        : <p className="muted">Revisar que estén todas las personas de cada perfil.</p>}
      <table>
        <thead><tr><th>Perfil</th><th>Aparece en</th><th>Nº de personas</th><th>Turnos y horario</th><th>Días</th></tr></thead>
        <tbody>{g.profiles.map(p => <tr key={p.name}><td>{p.name}</td><td>{p.products} productos</td><td className="ans" /><td className="ans" /><td /></tr>)}</tbody>
      </table>

      <h2>2. Recursos: cuántos hay de cada uno</h2>
      <p>El planificador tiene que saber cuántas unidades hay de cada máquina o equipo, para saber cuántos productos pueden usarlo a la vez.</p>
      <table>
        <thead><tr><th>Recurso</th><th>Lo usan</th><th>¿Cuántos hay?</th></tr></thead>
        <tbody>{g.resources.map(r => <tr key={r.name}><td>{r.name}</td><td>{r.products} productos</td><td className="ans" /></tr>)}</tbody>
      </table>

      <h2>3. Operaciones comunes (se responden una sola vez)</h2>
      <p>Estas operaciones se repiten en muchos productos y las grabaciones no dicen cuánto tardan o quién las hace. Si en algún producto es distinto, anotadlo.</p>
      <table>
        <thead><tr><th>Operación</th><th>Falta</th><th>Productos</th><th>Tiempo (fijo o por caja / carro / palet)</th><th>Personas y perfil</th></tr></thead>
        <tbody>{g.operations.map(o => (
          <tr key={o.key}><td>{o.label}</td><td>{o.missing.map(w => WHAT[w]).join(', ')}</td><td>{o.products.length}</td><td className="ans" /><td className="ans" /></tr>
        ))}</tbody>
      </table>

      <h2>4. Por producto</h2>
      {withQuestions.map(p => (
        <div className="prod" key={p.code || '—'}>
          <h3>{p.code || '(sin código)'} · {p.name}</h3>
          <ol>{p.questions.map((q, i) => <li key={i}>{q.q}<span className="line" /></li>)}</ol>
        </div>
      ))}

      {complete.length > 0 && <>
        <h2>Productos completos</h2>
        <p className="ok">{complete.map(p => `${p.code} ${p.name}`).join(' · ')}</p>
      </>}
    </>
  )
}

function Ficha({ p, data }) {
  const recipe = data.recepta.filter(r => r.producte === p.producte)
  const steps = stepsOf(data.flux, p.producte)
  const fields = PRODUCT_COLUMNS.filter(([k]) => !['producte', 'grup'].includes(k) && !isBlank(p[k]))
  return (
    <div className="ficha" id={`p-${p.producte}`}>
      <h2>{p.producte || '(sin código)'} · {p.grup}</h2>
      <table><tbody>{fields.map(([k, label]) => <tr key={k}><th style={{ width: '22%' }}>{label}</th><td>{String(p[k])}</td></tr>)}</tbody></table>

      {recipe.length > 0 && <>
        <h3>Receta</h3>
        <table>
          <thead><tr><th>Relleno</th><th>Kg / palet</th><th>g / unidad</th><th>Masa</th><th>Kg / palet</th><th>g / unidad</th><th>Comentarios</th></tr></thead>
          <tbody>{recipe.map((r, i) => (
            <tr key={i}><td>{r.codi_farcit}</td><td>{r.kg_farcit_palet}</td><td>{r.grams_per_unitat_farcit}</td><td>{r.codi_massa}</td><td>{r.kg_massa_palet}</td><td>{r.grams_per_unit_massa}</td><td>{r.comentaris}</td></tr>
          ))}</tbody>
        </table>
      </>}

      <h3>Pasos de fabricación</h3>
      {steps.length === 0 ? <p className="muted">Sin pasos todavía.</p> : (
        <table>
          <thead><tr><th>Día</th><th>Paso</th><th>Acción</th><th>Recurso</th><th>Tiempo</th><th>Personas</th><th>Frecuencia</th><th>Depende de</th></tr></thead>
          <tbody>{steps.map(s => {
            const r0 = s.rows[0]
            const alt = s.rows.find(r => !isBlank(r.alternativa_de))?.alternativa_de
            return (
              <tr key={s.pas}>
                <td>{dayLabel(r0.dia)}{!isBlank(r0.minuts_abans_produccio) && <div className="muted">{r0.minuts_abans_produccio} min antes</div>}</td>
                <td>{s.pas}{!isBlank(alt) && <div className="muted">alternativa del {alt}</div>}</td>
                <td>{s.accio}{!isBlank(r0.codi_intervinent) && <span className="muted"> ({uniq(s.rows.map(r => r.codi_intervinent)).join(', ')})</span>}</td>
                <td>{uniq(s.rows.map(r => r.linia)).join(' + ') || '—'}</td>
                <td>{timeLabel(s.rows)}</td>
                <td>{peopleLabel(s.rows)}</td>
                <td>{FREQ[r0.frequencia] || r0.frequencia || '—'}</td>
                <td>{r0.depen_de_pas || '—'}</td>
              </tr>
            )
          })}</tbody>
        </table>
      )}
    </div>
  )
}

function Catalogo({ data }) {
  const products = [...data.productes].sort((a, b) => String(a.producte || '').localeCompare(String(b.producte || ''), undefined, { numeric: true }))
  return (
    <>
      <h1>Catálogo de productos</h1>
      <p className="sub">Generado el {today()}: {products.length} productos y {data.linies.length} recursos. Es la información con la que trabajará el planificador.</p>
      <div className="idx">{products.map(p => <div key={p.producte || '—'}><a href={`#p-${p.producte}`}>{p.producte || '(sin código)'}</a> {p.grup}</div>)}</div>
      {products.map(p => <Ficha key={p.producte || '—'} p={p} data={data} />)}
      <div className="ficha">
        <h2>Recursos</h2>
        <table>
          <thead><tr>{RESOURCE_COLUMNS.map(([, l]) => <th key={l}>{l}</th>)}</tr></thead>
          <tbody>{[...data.linies].sort((a, b) => String(a.linia).localeCompare(String(b.linia))).map(l => (
            <tr key={l.linia}>{RESOURCE_COLUMNS.map(([k]) => <td key={k}>{l[k]}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    </>
  )
}

export default function Informes({ vista }) {
  const { data, loading } = useDatabase()
  return (
    <div className="inf">
      <style>{CSS}</style>
      <Bar vista={vista} data={data} />
      {loading ? <p className="muted">Cargando datos…</p>
        : vista === 'catalogo' ? <Catalogo data={data} /> : <Pendientes data={data} />}
    </div>
  )
}
