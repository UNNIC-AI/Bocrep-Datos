# 🏭 Producció Veu — Guia de Deploy

App d'entrada de dades de producció per veu amb IA.

## Arquitectura

```
Navegador (Chrome)
  ├── Web Speech API → reconeixement de veu (necessita HTTPS)
  ├── Anthropic API  → IA per extreure dades estructurades
  └── Supabase       → base de dades PostgreSQL (persistència)

Vercel → hosting gratuït amb HTTPS automàtic
```

---

## Pas 1: Crear el projecte a Supabase (base de dades)

1. Ves a **https://supabase.com** i crea un compte (gratis)
2. Crea un **New Project** → posa-li nom `produccio-veu`
3. Escull una contrasenya per la BD i la regió `eu-west` (o la més propera)
4. Espera ~2 min que es creï
5. Ves a **SQL Editor** (menú esquerre)
6. Copia i enganxa **TOT** el contingut del fitxer `supabase-schema.sql` que trobaràs al projecte
7. Prem **Run** — veuràs "Success" per cada taula
8. Ves a **Settings → API** i copia:
   - **Project URL** → `https://xxxxxxxx.supabase.co`
   - **anon public key** → `eyJhbG...` (la clau llarga)

---

## Pas 2: Obtenir la clau d'Anthropic

1. Ves a **https://console.anthropic.com/settings/keys**
2. Crea una nova API key
3. Copia-la → `sk-ant-...`

> ⚠️ **Nota de seguretat:** Aquesta clau s'exposa al navegador.
> Per a un entorn de producció real, hauries de crear una
> API route a Vercel que faci de proxy. Per ara, amb un ús intern
> i limitat, és acceptable.

---

## Pas 3: Pujar el codi a GitHub

1. Crea un repositori nou a **https://github.com/new**
   - Nom: `produccio-veu`
   - Privat (recomanat)
2. Al teu ordinador, descomprimeix el projecte i executa:

```bash
cd produccio-veu
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/EL-TEU-USUARI/produccio-veu.git
git push -u origin main
```

---

## Pas 4: Deploy a Vercel

1. Ves a **https://vercel.com** i entra amb GitHub
2. Prem **"Add New" → Project**
3. Importa el repositori `produccio-veu`
4. A **Environment Variables** afegeix les 3 claus:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` (la clau de Supabase) |
| `VITE_ANTHROPIC_API_KEY` | `sk-ant-...` (la clau d'Anthropic) |

5. Prem **Deploy**
6. Espera ~1 min → tindràs una URL tipus `produccio-veu.vercel.app`

**Ja està! 🎉** L'app funciona amb HTTPS, veu i dades persistents.

---

## Pas 5: Provar-ho

1. Obre l'URL de Vercel al **Chrome** (la veu no funciona a altres navegadors)
2. Ves a "Productes" i prem **"Gravar veu"**
3. Dicta, per exemple:

> *"Croissant de mantega, grup brioixeria, 200 unitats per palet,
> 20 caixes per palet, 10 per caixa, 15 quilos de massa per palet,
> codi massa M001, 3 quilos de farcit per palet, codi farcit F001,
> dies permesos dilluns dimecres divendres.
> La recepta porta 30 grams de farcit per unitat amb un 2% de merma,
> i 45 grams de massa amb un 3% de merma.
> El farcit és mantega amb 30 grams per unitat.
> Passa per la línia d'amassat, després formadora, després forn,
> i finalment envasat. L'amassat tarda 2 minuts per quilo amb 2 persones,
> la formadora 1 minut per quilo amb 1 persona, el forn 5 minuts per quilo
> sense personal, i l'envasat 0.5 minuts per quilo amb 3 persones."*

4. Prem **"Processar"** i revisa les 5 taules al preview
5. Confirma → les dades es guarden a Supabase permanentment

---

## Estructura del projecte

```
produccio-veu/
├── index.html              ← HTML d'entrada
├── package.json            ← dependències
├── vite.config.js          ← configuració Vite
├── supabase-schema.sql     ← SQL per crear les taules
├── .env.example            ← plantilla de variables d'entorn
├── .gitignore
├── docs/
│   ├── model-de-dades.md          ← com es guarden productes i receptes
│   └── revisio-model-de-dades.md  ← revisió: problemes i propostes
└── src/
    ├── main.jsx            ← punt d'entrada React
    ├── App.jsx             ← component principal (UI + veu + IA)
    ├── supabase.js         ← client Supabase
    └── useDatabase.js      ← hook CRUD (insert/update/delete)
```

---

## FAQ

**Les dades es perden si tanco el navegador?**
No. Es guarden a Supabase (PostgreSQL). Pots tancar i tornar a obrir.

**Funciona al mòbil?**
Sí, la veu funciona a Chrome mòbil. La interfície és scrollable.

**Puc veure les dades directament a Supabase?**
Sí! A Supabase Dashboard → Table Editor pots veure i editar totes les files.

**Quant costa?**
Zero. Vercel i Supabase tenen capes gratuïtes generoses.
L'únic cost és l'API d'Anthropic (~$0.003 per dictat de producte).

**Com faig backup?**
Usa el botó "Exportar tot (JSON)" de l'app o fes backup des de Supabase.
