# Revisió del model de dades — productes i receptes

Data de la revisió: 9 de novembre de 2026. Descripció del model actual:
[model-de-dades.md](model-de-dades.md).

## Estat

Corregit al codi, encara sense aplicar a la BD real: A1 a A8, B3, la part de B2 sobre els kg per massa
i farcit (`recepta`), i C7. A1 a A8 i B3 descriuen el comportament anterior.

Decisions per al reprocessament:

- Les variants mantenen totes les seves files, amb un enllaç al producte base.
- Si un producte pot tenir una gravació perduda, s'omple des de la seva descripció només el que estigui
  buit, sense excepció, i el producte continua marcat a l'informe.

## Abast

S'ha revisat `supabase-schema.sql`, els prompts i la lògica de desat de `src/App.jsx`,
`src/useDatabase.js` i `GUIA_GRAVACIO.md`.

**El que no s'ha pogut comprovar:**

- **La BD real.** S'ha revisat el fitxer d'esquema, no les taules de Supabase ni les seves dades.
  No se sap si totes les migracions s'hi han aplicat ni quants registres ja estan afectats.
  Les consultes de l'[annex](#annex-consultes-per-comprovar-la-bd-real) ho diuen, i només llegeixen.
- **`Proposta_de_taules_V2.xlsx`.** El codi diu que coincideix 1:1 amb aquest Excel, però no és al
  repositori, així que no s'ha pogut comparar.

Cada troballa indica com s'ha comprovat:

- **Executat**: s'ha fet córrer el codi real de resolució amb dades de prova.
- **Lectura**: deduït seguint el codi, sense executar-lo.
- **Model**: limitació de l'estructura de les taules.

## Conclusió

L'estructura serveix per **capturar i consultar** la informació d'un producte, i la idea de separar
producte, recepta, composició, flux i recursos és correcta. Té dos problemes de fons:

1. **Es perden dades en silenci quan ja n'hi ha d'altres.** La lògica de fusió associa files noves a
   files que no toquen. El primer producte es desa bé; els següents, no necessàriament. Això és el
   més urgent i es pot arreglar sense canviar l'esquema.
2. **Bona part del que necessita un optimitzador és text lliure.** Temps, dependències, capacitats i
   incompatibilitats es guarden perquè una persona els llegeixi, però un programa no els pot
   calcular. Si l'objectiu és optimitzar la producció, cal estructurar-los.

---

## A. Pèrdua de dades

### A1. Una matèria primera s'associa a una recepta que no és la seva — Executat

`farcit` i `masses` es comparen només per `codi_nom_mp`, sense mirar a quin farcit o massa
pertanyen (`src/App.jsx:194-203`). Com que la fila ja surt marcada, la comprovació correcta per
codi + matèria (`src/App.jsx:221-238`) no s'arriba a aplicar mai (`src/App.jsx:316`).

A més, `fuzzyMatch` tolera 2 caràcters de diferència, i per això la majoria de codis `M####` es
consideren iguals: `M2001` coincideix amb `M2002` i fins i tot amb `M3006`.

Prova amb `R3055` ja registrat (M2001 i M1010), dictant el farcit nou `R3070`:

| Dictat per a R3070 | Resultat |
|---|---|
| M2001, 50 kg | Actualitza la fila de **R3055**. No es crea res per a R3070 |
| M1011, 7 kg | Es reescriu com a M2001 i actualitza la mateixa fila de R3055 |
| Gambes, 42 kg | Es crea bé |

Com que la fila de destí ja està plena, els kg dictats es descarten. R3070 queda amb una sola
matèria i no surt cap avís, perquè l'avís només detecta codis sense cap matèria. A `masses` passa
igual: una `Farina` a M0007 s'associa a la `Farina` de M0002.

**Proposta:** treure `farcit` i `masses` de `ENTITY_DEFS` i deixar actuar `SECONDARY_CHECKS`. Si
`codi_nom_mp` té dígits, exigir coincidència exacta.

### A2. Recursos numerats es fusionen en un de sol — Executat

La guia i el prompt diuen que `Màquina 1` i `Màquina 4` són recursos diferents, però `fuzzyMatch`
els dona per iguals (també `Forn 1` i `Forn 2`). Si `Màquina 1` ja existeix, una `Màquina 4` nova es
reescriu com a `Màquina 1` tant al catàleg com al flux. La previsualització ho mostra a «Noms
normalitzats», però el valor per defecte és l'erroni.

**Proposta:** que els números del nom hagin de coincidir exactament.

### A3. Les gravacions successives no afegeixen passos al flux — Executat

Un pas s'identifica per `producte` + `pas` (`src/App.jsx:240-250`), però el mateix prompt demana
repetir el `pas` per a recursos paral·lels (`src/App.jsx:635`). A la IA tampoc no se li passen els
passos existents, i per tant cada àudio pot tornar a numerar des de 1.

Prova amb el pas 1 ja desat: una segona gravació amb un altre recurs al pas 1 i un pas 1 del dia 2
van tots dos a la fila existent. Cap dels dos es crea.

Això contradiu la guia: *«Pots gravar diversos àudios curts per al mateix producte. El sistema
fusionarà les dades automàticament.»*

**Proposta:** incloure `linia` i `dia` a la identitat, i passar a la IA els passos existents perquè
continuï la numeració.

### A4. «Refer» només coneix la darrera gravació — Lectura

`transcripcio` se sobreescriu a cada gravació (`src/App.jsx:1078-1081`). Si un producte s'ha fet amb
tres àudios, Refer esborra tot el producte i el regenera només amb el tercer. També es perden les
correccions manuals.

L'esborrat es fa abans de cridar la IA i abans de confirmar (`src/App.jsx:1249-1257`). Si la IA falla
o es prem «Descartar», el producte, la recepta i el flux ja no hi són; només es conserva el text.

**Proposta:** acumular les transcripcions (idealment en una taula `gravacions`) i fer l'esborrat en
confirmar.

### A5. Un error en desar buida la previsualització — Lectura

`confirmAll` executa `setPend(null); setTxt("")` encara que hi hagi errors (`src/App.jsx:1085`).
Una sola fila dolenta fa fallar tota la taula, perquè cada taula s'insereix d'un sol cop: per
exemple, un `3,5` amb coma editat en un camp numèric. El resultat és un producte desat a mitges i
les files fallides perdudes, sense transacció que ho desfaci.

**Proposta:** conservar a la previsualització el que no s'ha desat, i a mitjà termini desar tot el
producte amb una funció SQL (RPC) transaccional.

### A6. Una recepta completada en dues vegades queda duplicada — Executat

Una fila amb només el farcit i una altra amb el mateix farcit més la massa no coincideixen
(`src/App.jsx:213-219`). En resulten dues files amb R3055, i si se sumen els grams es compten dos
cops.

### A7. Files sense producte, sense relació recuperable — Executat

Si el producte de `recepta` o `flux` no coincideix exactament amb el de `productes`, el camp es buida
(`src/App.jsx:294-296`). Si no s'ha dictat cap codi, el producte es desa amb codi null. En tots dos
casos les files queden deslligades, i cada gravació sense codi crea files noves.

**Proposta:** bloquejar la confirmació sense codi de producte i posar `NOT NULL`.

### A8. Les edicions que fallen no s'avisen — Lectura

`updateCell` envia el valor tal qual i els errors només van a la consola
(`src/useDatabase.js:194-214`). Buidar una cel·la numèrica envia `""`, que PostgreSQL hauria de
rebutjar: la pantalla la mostra buida i, en recarregar, torna el valor antic. No s'ha provat contra
una BD real.

**Proposta:** convertir `""` en `null` i mostrar l'error a l'usuari.

---

## B. Limitacions del model

### B1. `kg_per_palet` depèn del producte, però viu en un catàleg compartit — Model

`farcit` i `masses` són catàlegs compartits entre productes, però els kg són *«per palet de
producte»*. Dos productes amb el mateix R3055 i palets diferents necessiten quantitats diferents, i
només hi ha lloc per a una. **Aquest és el defecte estructural més important.**

**Proposta:** guardar la composició en proporció (kg per kg de farcit) i calcular els kg per palet
per a cada producte. Depèn de la pregunta 1.

### B2. Un sol valor de kg per a diverses masses o farcits — Model

`codi_massa` i `codi_farcit` admeten una llista, però `kg_massa_palet` i `kg_farcit_palet` tenen un
sol número. En afegir una segona massa, el codi s'acumula i els kg es descarten
(`src/useDatabase.js:148-161`). A més, la llista repeteix informació de `recepta` i les dues es poden
desincronitzar.

### B3. El flux no té on dir què es fa — Executat

La guia demana dictar *què* es fa, però no hi ha cap columna per a això, i `linia` fa dues funcions.
Els exemples del prompt hi posen tasques (`Preparació de carros`, `src/App.jsx:626`), quan la seva
pròpia definició diu que `linia` és un recurs físic (`src/App.jsx:608`).

Conseqüència verificada: `Preparació de carros` i `Fabricat Producte / carros / tunel` es creen com a
recursos, tot i que el prompt de recursos ho prohibeix (`src/App.jsx:674`). I si la IA segueix la
definició i posa null, el pas queda sense nom.

**Proposta:** afegir `flux.accio` (la tasca) i deixar `linia` només per al recurs.

### B4. Dades que l'optimitzador no pot calcular — Model

| Dada | Avui | Què caldria |
|---|---|---|
| Temps del pas | Text a `temps_per_kg` (`45 min / 150 kg`, `68 cajas / hora`). El nom ja no descriu el contingut | Mantenir el text i afegir durada, quantitat i unitat |
| Dependències | Text a `prerequisits` | Relació pas → pas |
| Capacitat i lots | Text a `comentaris` (`mínim 90 / màxim 300 kg`) | `capacitat_min`, `capacitat_max`, unitat |
| Dies permesos | Text amb dos formats | Format únic o array |
| Incompatibilitats | Frase lliure | Regles per família o atribut, amb àmbit |
| Perfils | Text, barreja d'idiomes (`Cocinero`, `cuiner`) | Llista tancada, igual que a `torns` |

### B5. Diversos recursos en un pas — Model

La guia diu que es crea una fila per recurs, però el prompt també accepta noms compostos com a recurs
únic (`Freidora / Balanzas / Rustideros`). Amb noms compostos, `Balança` no es pot detectar com a
ocupada quan apareix en dos noms diferents. El model tampoc no distingeix entre «necessita A **i** B»
i «pot fer-se a A **o** B», i el prompt ho barreja (`src/App.jsx:635`).

### B6. Neteja i preparació es poden comptar dues vegades — Model

Una neteja queda com a pas del flux i també es demana sumar-la a `linies.temps_neteja`
(`src/App.jsx:676`). Si es fan servir tots dos valors, es compta doble. A més, `temps_neteja` és
únic per recurs, tot i que la neteja pot dependre del producte, i els recursos existents no
s'actualitzen. Cal triar una sola font: es recomana el pas del flux.

### B7. Falta un catàleg de matèries primeres i els nivells de recepta — Model

- `codi_nom_mp` guarda un codi **o** un nom. De *«les gambes, que són la M####»* només en queda un.
- La mateixa matèria amb grafies diferents no es pot sumar, i per tant no es poden calcular compres
  ni consum total.
- Una matèria pot ser una preparació amb ingredients propis, com als exemples de la guia, però la
  taula només té un nivell. Els *105 kg d'espinacs* de la M3006 no tenen lloc propi.
- `farcit` i `masses` són idèntiques i es podrien unificar.

### B8. El sentit de `recepta` és ambigu amb diversos components — Model

Una massa i un farcit són components independents, però la taula els combina en una fila. Amb dos
farcits i la mateixa massa (cas de la guia) resulten dues files amb 40 g de massa cadascuna: sumant
surten 80 g. Tampoc no se sap si els dos farcits van junts o són alternatius.

**Proposta:** una fila per component (producte + component, amb rol, grams, merma i kg per palet).
Això resoldria també B2 i A6.

### B9. La merma no està definida — Model

N'hi ha a dos nivells (`recepta.merma_*` i `farcit.merma`) i enlloc no es diu com s'apliquen. Quan
falta la composició, `src/App.jsx:341` copia la merma de la recepta a la columna de matèria primera,
que és un altre concepte. Les xifres de l'exemple de la guia tampoc no quadren entre si:

| Comprovació (producte 24155536) | Resultat | Declarat |
|---|---|---|
| Farcit: Σ kg × (1 − merma) | **327,93 kg** | 328,01 kg, quadra |
| Farcit: Σ kg brut | 483,56 kg | no quadra |
| Massa: Σ kg brut | **335,00 kg** | 335,01 kg, quadra |
| Massa: Σ kg × (1 − merma) | 330,53 kg | no quadra |
| Farcit: 72 g × 4420 unitats | 318,24 kg | 328,01 kg, diferència del 3 % amb merma de l'1 % |
| Massa: 40 g × 4420 unitats | 176,80 kg | 335,01 kg, gairebé el doble |

Pot ser que l'exemple sigui només il·lustratiu, però el farcit i la massa semblen seguir regles
diferents. Cal definir-ho (pregunta 3) abans de calcular res.

### B10. Dades dictades sense lloc propi — Model

| Es dicta | On va a parar |
|---|---|
| Pes de la unitat (110 g) | Dins del nom, a `grup` |
| Família del producte | Enlloc. `grup` conté el nom comercial, però les incompatibilitats parlen de famílies (*«altres crepes salats»*) |
| Temperatures (*90 graus*) | `prerequisits` o `comentaris` |
| Esperes dins d'un pas | Text del temps o comentaris |
| Conservació (*producte congelat*) | `comentaris` |
| Al·lèrgens o atributs (*amb formatges*) | Només dins d'`incompatible_amb` |

---

## C. Integritat i seguretat

| # | Troballa | Conseqüència | Proposta |
|---|---|---|---|
| C1 | Sense `FK`, `UNIQUE`, `NOT NULL` ni `CHECK` | Duplicats, orfes i mermes fora de rang (un 24,8 en lloc de 0,248) no es rebutgen | Afegir-les després de netejar dades |
| C2 | Eliminar un producte només esborra aquella fila (`src/App.jsx:1130`) | `recepta` i `flux` queden orfes | Cascada, amb confirmació |
| C3 | Canviar un codi a la taula no el propaga | Es trenca la relació en silenci | `ON UPDATE CASCADE` amb les FK |
| C4 | Les files de codi pendent no s'esborren en omplir la composició | Queda una fila buida per sempre, amb una merma copiada | Reutilitzar-la o esborrar-la |
| C5 | No hi ha `updated_at`, versions ni historial | Un canvi de fórmula no deixa rastre | `updated_at` i, si cal traçabilitat, versions de recepta |
| C6 | Política `Allow all` amb la clau pública de Supabase | Qui tingui la URL de l'app pot llegir, modificar o esborrar totes les receptes. El comentari de l'esquema diu «desactivat», però no és així | Login de Supabase i polítiques per a usuaris autenticats |
| C7 | `create policy` no és repetible | Tornar a executar tot l'esquema falla. Cal executar només les migracions | Afegir `drop policy if exists` |
| C8 | La columna antiga `farcit.grams_per_unitat` es pot conservar | Columna sobrant a les BD antigues | Comprovar-ho amb l'annex i eliminar-la |

---

## Proposta d'ordre de treball

**Fase 1 — Aturar la pèrdua, sense canviar l'esquema.** A1, A2, A3, A4, A5, A6, A7 i A8. A1 i A2 són
pocs canvis i protegeixen tot el que s'enregistri a partir d'ara.

**Fase 2 — Blindar les dades.** Executar l'annex, netejar el que surti, afegir les restriccions de
C1-C3, tancar C6 i afegir `flux.accio` (B3), família, pes unitari i capacitats.

**Fase 3 — Model per a l'optimitzador**, un cop respostes les preguntes:

| Taula | Canvi |
|---|---|
| `components` | Nova: tot codi, amb tipus (massa, farcit, preparació, matèria primera) i nom. Resol l'ambigüitat de `M####` |
| `composicio` | Substitueix `farcit` i `masses`: component pare → component fill, proporció i merma. Permet diversos nivells |
| `producte_components` | Substitueix `recepta` i les llistes de `productes`: rol, grams, merma i kg per palet |
| `gravacions` | Nova: totes les transcripcions de cada producte |
| `flux` | Temps estructurat, recursos en relació pròpia (amb mode i/o) i dependències entre passos |

La Fase 3 implica migrar dades. Convé fer-la abans que el volum de productes creixi.

---

## Preguntes per a l'equip de producció

1. **Un mateix farcit o massa es fa servir en productes amb palets diferents?** Si és que sí, B1 és
   urgent. Si no, es pot ajornar.
2. **Quan un producte té dos farcits, van tots dos a la mateixa unitat o són alternatius?**
3. **Com es calcula la merma?** Els kg per palet són abans o després de merma? Com es relaciona la
   merma de la recepta amb la de cada matèria primera?
4. **Quan un pas té diversos recursos, s'usen alhora o es pot triar?**
5. **Les incompatibilitats, a quin àmbit s'apliquen** (dia, setmana, línia) **i per quin criteri**
   (família, ingredient, al·lèrgen)?
6. **El temps de neteja depèn del producte o només de la màquina?**
7. **Cal saber quina fórmula estava vigent en una data passada?**
8. **`Proposta_de_taules_V2.xlsx` encara és la referència?** Convindria afegir-la al repositori.

---

## Annex: consultes per comprovar la BD real

Només llegeixen. Es poden executar al SQL Editor de Supabase.

```sql
-- Columnes reals (per detectar migracions no aplicades)
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('productes','recepta','farcit','masses','linies','flux')
order by table_name, ordinal_position;

-- Productes duplicats o sense codi
select producte, count(*) from productes
group by producte having count(*) > 1 or producte is null;

-- Recepta i flux sense producte existent
select 'recepta' as taula, r.id, r.producte from recepta r
  left join productes p on p.producte = r.producte where p.id is null
union all
select 'flux', f.id, f.producte from flux f
  left join productes p on p.producte = f.producte where p.id is null;

-- Mermes fora de rang
select 'farcit' as taula, id, merma from farcit where merma not between 0 and 1
union all select 'masses', id, merma from masses where merma not between 0 and 1
union all select 'recepta farcit', id, merma_farcit from recepta where merma_farcit not between 0 and 1
union all select 'recepta massa', id, merma_massa from recepta where merma_massa not between 0 and 1;

-- Pregunta 1: farcits compartits per diversos productes
select codi_farcit, count(distinct producte) as productes,
       array_agg(distinct producte) as llista
from recepta where codi_farcit is not null
group by codi_farcit having count(distinct producte) > 1;

-- Pregunta 3 i A1: kg declarats davant de la composició (productes amb un sol farcit)
select p.producte, p.codi_farcit, p.kg_farcit_palet,
       round(sum(f.kg_per_palet), 2) as suma_bruta,
       round(sum(f.kg_per_palet * (1 - coalesce(f.merma, 0))), 2) as suma_neta,
       count(f.id) as materies
from productes p
join farcit f on f.codi_farcit = p.codi_farcit
group by p.producte, p.codi_farcit, p.kg_farcit_palet
order by p.producte;

-- Recursos que en realitat semblen tasques (B3)
select id, linia, tipus from linies
where linia ilike 'prepara%' or linia ilike 'fabrica%' or linia ilike 'encaixat%';
```
