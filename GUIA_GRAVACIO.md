# 🎙️ Guia per gravar un producte nou

Aquesta guia és per a la persona que **registra la informació amb la veu**. Seguint aquest guió, l'IA podrà omplir TOTES les taules correctament en una sola gravació.

> 💡 Pots gravar **un sol àudio llarg** o **diversos àudios curts** per al mateix producte. El sistema fusionarà les dades automàticament.

---

## 📋 Ordre recomanat per dictar

1. **Identificació** del producte
2. **Mesures de palet** (unitats, caixes, kg)
3. **Receta** (masses i farcits que utilitza)
4. **Composició del farcit** (matèries primeres)
5. **Composició de la massa** (matèries primeres)
6. **Restriccions** (dies permesos, incompatibilitats)
7. **Flux de producció** (passos en ordre)

---

## 1️⃣ Identificació del producte

**Què cal dir:**
- Codi del producte (ex: `24155536`)
- Nom comercial / grup (ex: `Crepes Salados 110gr`)

**Exemple de frase:**
> *«Producte número 24155536, Crepes Salados de 110 grams.»*

---

## 2️⃣ Mesures de palet

**Què cal dir** (els 5 valors):
- Unitats per palet
- Caixes per palet
- Unitats per caixa
- Kg de massa per palet
- Kg de farcit per palet

**Exemple de frase:**
> *«El palet té 4420 unitats, 221 caixes i 20 unitats per caixa. Porta 335,01 kg de massa i 328,01 kg de farcit.»*

---

## 3️⃣ Recepta

**Què cal dir per cada combinació massa+farcit:**
- Codi de la massa (format `M####`, ex: `M0002`)
- Grams de massa per unitat
- Merma de la massa (en % o decimal, ex: `24,8%` o `0,248`)
- Codi del farcit (format `R####`, ex: `R3055`)
- Grams de farcit per unitat
- Merma del farcit

**Exemple de frase:**
> *«La massa és la M0002, amb 40 grams per unitat i 24,8% de merma. El farcit és R3055, amb 72 grams per unitat i 1% de merma.»*

> ⚠️ Si el producte té **múltiples farcits**, dicta cadascun per separat:
> *«Té dos farcits: R3055 amb 72 grams per unitat i 1% de merma, i R3070 amb 50 grams per unitat i 2% de merma. Tots dos amb la mateixa massa M0002.»*

> ⚠️ Igualment, si el producte té **múltiples masses**, dicta-les per separat:
> *«Té dues masses: la M0002 amb 40 grams per unitat i 24,8% de merma, i la M0007 amb 25 grams per unitat i 12% de merma.»*
>
> El sistema guarda una fila per cada combinació de massa i farcit, així que pots tenir tantes masses i farcits com calgui en un mateix producte.

---

## 4️⃣ Composició del farcit (matèries primeres)

> 🔑 Aquesta part és clau si es tracta d'un **farcit nou**. Si el farcit ja està registrat al sistema, pots ometre-la.

**Què cal dir per cada matèria primera del farcit:**
- Codi del farcit al qual pertany (`R####`)
- Codi o nom de la matèria primera (`M####` o nom comú, ex: `Ricotta`)
- Kg per palet
- Merma (decimal)

**Exemple de frase:**
> *«El farcit R3055 està compost per: M2001 amb 142,03 kg i 3% de merma, M3006 amb 228,67 kg i 65% de merma, M4007 amb 34,23 kg i 8% de merma, M1010 amb 23,62 kg sense merma, M1011 amb 5,81 kg sense merma, i Ricotta amb 49,2 kg sense merma.»*

---

## 5️⃣ Composició de la massa (matèries primeres)

> 🔑 Igual que amb el farcit: només cal dictar-ho si es tracta d'una **massa nova**. Si la massa ja està registrada al sistema, pots ometre-la.

**Què cal dir per cada matèria primera de la massa:**
- Codi de la massa a la qual pertany (`M####`)
- Codi o nom de la matèria primera (`M####` o nom comú, ex: `Farina`)
- Kg per palet
- Merma (decimal)

**Exemple de frase:**
> *«La massa M0002 està composta per: M1001 amb 210,5 kg i 2% de merma, Farina amb 98,3 kg sense merma, i M1005 amb 26,2 kg i 1% de merma.»*

---

## 6️⃣ Restriccions i incompatibilitats

**Què cal dir:**
- **Dies permesos** — quins dies de la setmana es pot fabricar.
  Pots usar les sigles `Dll, Dm, Dc, Dj, Dv, Ds, Dg` o els noms complets.
- **Incompatibilitats** — què NO es pot fabricar el mateix dia / la mateixa setmana.

**Exemple de frase:**
> *«Es fabrica els dimecres, dijous i divendres. No es poden fabricar altres crepes salats ni rolls el mateix dia. Tampoc altres productes que portin masses amb formatges.»*

---

## 7️⃣ Flux de producció (la part més llarga)

> 🔑 És **molt important** descriure el procés **de principi a fi**, en l'ordre real, i indicar **quin dia del cicle** s'executa cada bloc.

### Estructura per a cada pas:

1. **Què** es fa (ex: «netejar olla», «mesclar farcit», «fregir», «encaixar»)
2. **Quan** — dia del cicle (Dia 1, Dia 2…)
3. **Sobre quin codi** intervé (massa `M####` o farcit `R####`), o `null` si és administratiu
4. **Quin recurs físic** s'utilitza (ex: «Olla mitjana», «Forn 1», «Freidora»)
5. **Quant temps** triga — sigues lliure d'expressar-ho com vulguis:
   - *«45 minuts per 150 kg»*
   - *«15 minuts»*
   - *«1400 unitats per hora»*
   - *«68 caixes per hora»*
6. **Quantes persones** calen i de **quin perfil** (cuiner, encarregat, directa, indirecta, qualsevol)
7. **Es pot parar** el procés en aquest punt? (Sí/No)
8. **Què cal que estigui acabat abans** (prerequisits) — frase lliure
9. **Comentaris** o limitacions tècniques (ex: *«màxim 60 kg per container»*, *«palet màxim 221 caixes»*)

### Frase model:

> *«Pas 1, dia 1: a l'olla mitjana posem la matèria M2001. Triga 45 minuts per 150 kg, hi cal 1 cuiner i no es pot parar.»*

> *«Pas 2, dia 1: neteja de l'olla mitjana. 15 minuts, 1 cuiner o directa. Es pot parar. Cal haver acabat el pas anterior amb M2001. Màxim 60 kg per container.»*

### Coses a recordar al flux:

| Situació | Què dictar |
|---|---|
| Un pas **utilitza diversos recursos alhora** (ex: forn + balança + abatidor) | Diu-ho: *«s'utilitza forn, balança i rustidor alhora»*. L'IA crearà una fila per recurs. |
| Hi ha **diverses unitats iguals** del mateix recurs (ex: 2 olles mitjanes idèntiques) | Diu la quantitat: *«hi ha 2 olles mitjanes iguals»*. Queda a la columna **Quantitat** de Recursos. |
| Hi ha recursos **numerats** (Màquina 1, Màquina 2, Màquina 4) | Anomena'ls sempre amb el número. Són recursos **diferents**, no unitats del mateix. |
| Un pas és **administratiu** (preparació de carros, etiquetes, control) | Diu *«no ocupa cap màquina concreta»* o ometre el recurs. |
| Un pas és **una neteja** d'una màquina ja descrita | No cal crear un recurs nou — diu només *«neteja de l'olla mitjana, 15 minuts»*. El sistema ho sumarà com a temps de neteja del recurs. |
| Un dia té **molts passos** | Numera explícitament: *«Pas 1… Pas 2… Pas 3…»*. |
| Un mateix material té **subprocessos** (preparar, escórrer, refredar, netejar) | Tracta'ls com a passos separats consecutius. |
| Hi ha un **pas final** d'envasat / paletització | Sempre inclou-lo. És el que tanca el procés. |

---

## ✅ Checklist abans de dictar

- [ ] Sé el **codi del producte** (i el nom comercial)
- [ ] Tinc les **xifres del palet** (unitats, caixes, kg)
- [ ] Tinc la **recepta** (massa + farcit + grams + mermes)
- [ ] Sé si el **farcit ja existeix** o l'he de descriure complet
- [ ] Sé si la **massa ja existeix** o n'he de descriure la composició
- [ ] Tinc clars els **dies permesos** i les **incompatibilitats**
- [ ] He **ordenat mentalment** el flux: Dia 1 → Dia 2 → … → encaixat final

---

## 🎤 Exemple complet (curt) — Producte 24155536

> *«Producte 24155536, Crepes Salados 110gr.*
> *Palet: 4420 unitats, 221 caixes, 20 unitats per caixa. 335,01 kg de massa i 328,01 kg de farcit.*
> *Massa M0002, 40 grams per unitat, 24,8% de merma. Farcit R3055, 72 grams per unitat, 1% de merma.*
> *El R3055 porta: M2001 142 kg amb 3% merma; M3006 228 kg amb 65% merma; M4007 34 kg amb 8% merma; M1010 23 kg sense merma; M1011 5,8 kg sense merma; i Ricotta 49 kg sense merma.*
> *La M0002 porta: M1001 210,5 kg amb 2% merma; Farina 98,3 kg sense merma; i M1005 26,2 kg amb 1% merma.*
> *Es fabrica dimecres, dijous i divendres. No es poden fabricar altres crepes salats ni rolls.*
>
> *Flux. Dia 1.*
> *Pas 1: olla mediana amb M2001, 45 minuts per 150 kg, 1 cuiner, no es pot parar.*
> *Pas 2: neteja olla mediana, 15 minuts, 1 cuiner directa, es pot parar, cal acabar M2001.*
> *Pas 3: olla gran amb M3006, primer 20 minuts per omplir d'aigua, després 120 minuts d'escalfament, després 30 minuts fins a 90 graus, després afegir 105 kg d'espinacs i esperar 90 minuts fins a 85 graus, després 60 minuts d'escorregut, després 30 minuts a balança i rustidors, després 30 minuts de neteja.*
> *Pas 4: freidora amb M4007, 75 minuts, 1 cuiner directa, no es pot parar, capacitat 35 kg per hora.*
> *Després freidora amb M1011, 30 minuts, després neteja 15 minuts.*
> *Després fogó amb M1010, 30 minuts, després neteja 15 minuts.*
> *Pas final del dia 1: preparació de carros, 40 minuts, 1 persona qualsevol, es pot parar.*
>
> *Dia 2.*
> *Mescla manual del R3055 amb remo, 60 minuts, 1 cuiner, es pot parar, cal afegir la ricotta. 18 minuts per container.*
> *Neteja màquina de rentat dels rustidors, 60 minuts, 1 encarregat o cuiner indirecte.*
> *Turmix gran amb la balança per la M0002, 45 minuts per batut, 1 cuiner, no es pot parar. Cal haver acabat la mescla R3055. Batuts de mínim 90 i màxim 300 kg.*
> *Preparació màquina 4: 60 minuts, 1 encarregat, no es pot parar. Línia neta i muntada.*
> *Fabricat producte amb carros i túnel: 1400 unitats per hora, 3 persones (encarregat, indirecte, directa), no es pot parar.*
> *Neteja màquina 4: 180 minuts, 1 directa, es pot parar.*
> *Neteja containers: 1 encarregat o indirecte, es pot parar, containers buits de farcit.*
> *Preparació caixes i etiquetes: 15 minuts cada 75 caixes, 1 persona qualsevol, es pot parar.*
> *Preparació detector metalls: 15 minuts, 1 encarregat o personal autoritzat, no es pot parar.*
> *Encaixat i paletització: 68 caixes per hora, 1 persona qualsevol, es pot parar. Producte congelat.*
> *Retractilar: 15 minuts per palet, 1 encarregat o indirecte, es pot parar. Palet màxim 221 caixes.*
> *Neteja encaixadora i detector metalls: 15 minuts, 1 persona qualsevol, sí es pot parar. Finalitza l'encaixat.»*

---

## 🧩 Què passa després de gravar

1. L'IA fa **3 crides seqüencials**:
   - 1ª → Producte + Recepta + Farcit + Masses
   - 2ª → Flux (passos)
   - 3ª → Recursos nous (línies)
2. Es mostren totes les files **proposades** abans de desar-les.
3. Pots **editar qualsevol cel·la** abans de confirmar.
4. En confirmar, les files es desen a la BBDD. **Si tornes a gravar més info del mateix producte, només s'omplen els camps que estaven buits i s'afegeixen els passos i files nous — no s'esborra res del que ja hi ha.** Cada descripció queda guardada per sempre.
5. Tot codi de farcit o massa que esmentis tindrà **sempre una fila** a la seva taula, encara que no n'hagis descrit la composició. Aquests codis pendents apareixen marcats amb ⚠️ a les pestanyes **Farcit**, **Masses** i **Recepta**, perquè sàpigues què queda per completar.
6. Igualment, tot recurs que aparegui al flux tindrà **sempre una fila** a la pestanya **Recursos**, amb quantitat 1 per defecte. Si en falta cap (per exemple de gravacions antigues), la pestanya mostra un avís amb un botó per crear-los de cop.
7. Totes les **gravacions es guarden** amb el producte. Si l'extracció no ha sortit bé, prem **Refer** a la pestanya Productes: podràs corregir el text (o afegir-hi coses dictant) i es tornarà a extreure tot. Si el producte és una variant, es regenera a partir del seu producte base i les diferències. En **confirmar** se substitueixen el producte, la seva recepta i el seu flux, al contrari que tornar a gravar, que només omple buits. Si descartes o falla, no canvia res.

> ⚠️ **Refer** no toca Farcit, Masses ni Recursos, que són catàlegs compartits amb altres productes. Si hi queda algun codi buit que ja no fa servir ningú, les pestanyes Farcit i Masses mostren un avís per esborrar-lo.

---

## ⚠️ Errors freqüents que cal evitar

- ❌ Dictar **percentatges** sense aclarir-ho. (Dius *«tres»* i no se sap si és 3 o 3%.) → Diu sempre *«tres per cent»* o *«zero coma zero tres»*.
- ❌ Saltar-se el **dia del cicle**. → Comença cada bloc amb *«Dia 1»*, *«Dia 2»*.
- ❌ No mencionar el **codi de la matèria** del pas. → Diu sempre *«amb la M2001»*, *«del farcit R3055»* per lligar els passos a la recepta.
- ❌ Parlar de *«la massa»* sense dir-ne mai el **codi**. → Si no el dictes, el camp queda buit. Diu *«la massa és la M####»* una vegada com a mínim.
- ❌ Tractar la **neteja com a recurs nou**. → Diu *«neteja de l'olla mediana»*, no *«recurs nou: limpieza olla mediana»*.
- ❌ Oblidar el **pas final** (envasat/paletització). → Inclou'l sempre.
