# Informe de productes abans de reprocessar

Generat el 2026-11-09 a partir de l'exportació JSON (67 productes). Només descriu l'estat de les dades: no s'ha canviat cap fila.

## Resum

| Categoria | Productes |
|---|---|
| Sense descripció | 1 |
| Completa | 48 |
| Variant | 17 |
| Sense codi | 1 |

Productes amb avís de possible gravació perduda o correcció manual: 12 (626524, 628324, 229424, 111320, 225948, 226948, 2210848, 265722, 24382, 246210724, 24620924, 24100932). Aquest avís és una detecció automàtica: indica que un valor desat no apareix a la descripció, no que s'hagi perdut res amb certesa.

## Limitacions

- L'exportació només conté les primeres 1000 files de `flux`, pel límit de lectura de Supabase. Els passos a partir del producte 6210820 no s'han pogut revisar.
- Hi ha 57 passos i 8 línies de recepta sense producte. Pels codis de les receptes, les línies semblen de 246122 (R2061), 6211124 (R6111), 24157536 (R4074) i dels productes amb R1010 (24621024, 24101032).

## Codis sense producte i proposta

| Codi a les dades | Producte proposat | Evidència |
|---|---|---|
| 171202 | 17120830 | M0010 i R1029 coincideixen. Una segona línia (M0004, R0675) no coincideix. |
| 265222 | 265722 | R4057 i 20,48 kg de M0004 coincideixen. 24265722 conté el codi 265722. |
| crep_mousse_turron_80g | 102830 | M0010 i R1028 coincideixen. |
| 1400932 | 24100932 | La descripció de 24100932 esmenta aquest codi i els kg coincideixen. |
| 2462107204 | 246210724 | La descripció de 246210724 esmenta aquest codi i R4107 coincideix. |

## Detall per producte

| Codi | Producte | Tipus | Base | Lletres | Passos | Receptes | Avisos |
|---|---|---|---|---|---|---|---|
| 17120830 | Burrito de Chocolate 80gr | Sense descripció |  | 0 | 0 | 0 | Dades sota un altre codi: `171202 (23 passos, 2 línies de recepta)` |
| 626524 | Roll de Chile y Carne | Completa |  | 6963 | 20 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: caixes_per_palet=130, kg_massa_palet=646.62, kg_farcit_palet=397.96 |
| 626624 | Roll de Pollo y Cilantro | Variant | 626524 | 127 | 20 | 1 |  |
| 628324 | Rol de Ternera. Taquera. | Variant | 626624 | 76 | 20 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: codis R4083; kg_farcit_palet=400.08 |
| 226724 | Mini Burrito de Chili, Carne 50g | Completa |  | 5651 | 27 | 1 |  |
| 229424 | Mini Burrito de Pollo y Cilantro 50g | Variant | 226724 | 111 | 27 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: codis R4066 |
| 111320 | Crep Mini Chocolate 30g | Completa |  | 5975 | 26 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: caixes_per_palet=130, unitats_per_caixa=120 |
| 225948 | Burrito de Pollo Mexicano 175g | Completa |  | 4937 | 22 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: unitats_per_caixa=18 |
| 226948 | Burrito Kebab de Ternera y Yogurt 175g | Variant | 225948 | 136 | 22 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: codis R4104 |
| 2210848 | Burrito, Thay, pollo y curry | Variant | 225948 | 156 | 22 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: codis R4108, R40108 |
| 235952 | Burrito de Pollo y Jalapeño 190g | Variant | 225948 | 293 | 22 | 1 |  |
| 236948 | Taco kebab de ternera y yogur 170g | Completa |  | 4467 | 24 | 2 |  |
| 236952 | Taco kebab de ternera y yogur 190g | Variant | 236948 | 159 | 24 | 2 |  |
| 265722 | Miniflauta de Pollo y Maíz 40g | Variant | 226724 | 514 | 0 | 0 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: unitats_per_caixa=78, kg_farcit_palet=218.98<br>Dades sota un altre codi: `265222 (27 passos, 1 línia de recepta)` |
| 4269522 | Miniflauta de Calabacín, Berenjena y Pimie | Variant | 265222 | 170 | 27 | 1 | ⚠ Base `265222` no existeix (proposta: 265722) |
| 24226724 | Mini Burrito de Chili, Carne 50g | Variant | 226724 | 417 | 27 | 1 |  |
| 24229424 | Mini Burrito de Chili, Carne 50g | Variant | 24226724 | 111 | 27 | 1 |  |
| 24265722 | Miniflauta de Pollo y Maíz 40g | Variant | 265222 | 204 | 27 | 1 | ⚠ Base `265222` no existeix (proposta: 265722) |
| 334269522 | Miniflauta de Calabacín, Berenjena y Pimie | Variant | 4269522 | 199 | 27 | 1 |  |
| 111820 | Crep Mini Crema Pastelera 30g | Variant | 111320 | 182 | 26 | 1 |  |
| 239549 | Taco Burrito Calabacín Berenjena y pimient | Variant | 236948 | 191 | 24 | 2 |  |
| 2310852 | Tako Thai de Pollo y Curry 190g | Variant | 235952 | 127 | 22 | 1 |  |
| 24100832 | Crepe Chocolate 90gr | Completa |  | 3482 | 20 | 1 |  |
| 24382 | Crepe de chocolate 50g/u | Variant | 24100832 | 144 | 20 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: kg_massa_palet=353.76, kg_farcit_palet=196.85 |
| 62950 | Crep de Bombon 80g Europastry | Completa |  | 3946 | 26 | 1 |  |
| 266929 | Kebab Ternera Yogur 75g | Completa |  | 3905 | 21 | 1 |  |
| 102830 | Crep Mousse Turrón 80g | Completa |  | 4451 | 0 | 0 | Dades sota un altre codi: `crep_mousse_turron_80g (23 passos, 1 línia de recepta)` |
| 24157636 | Crepe Changurro 110gr | Completa |  | 3667 | 22 | 1 |  |
| 24100728 | Crepe Nutella 70gr | Completa |  | 3455 | 18 | 1 |  |
| 110724 | Crepe Nutella 50gr | Completa |  | 3453 | 18 | 1 |  |
| 24110720 | Crêpe Nutella 30gr | Completa |  | 3456 | 20 | 1 |  |
| 24246122 | Mini Quesadilla Cheddar y Jalapeño 40gr | Completa |  | 4485 | 26 | 1 | Molt semblant a 246122 |
| 242410522 | Mini Quesadilla de Cheddar y Bacon 40g | Completa |  | 5001 | 32 | 1 | Molt semblant a 2410522 |
| 626224 | Roll Cheddar y Jalapeño 50gr | Completa |  | 6386 | 24 | 1 |  |
| 140730 | Crepe Nutella Medialuna 80gr | Completa |  | 3441 | 19 | 1 |  |
| 246122 | Mini Quesadilla Cheddar y Jalapeño 40gr | Completa |  | 4467 | 0 | 0 | Molt semblant a 24246122 |
| 2410522 | Mini quesadilla Cheddar y bacon 40gr | Completa |  | 5001 | 35 | 1 | Molt semblant a 242410522 |
| 626220 | Roll de cheddar y jalapeño 30gr/u | Completa |  | 6382 | 30 | 1 |  |
| 626520 | Rol de Chile y carne | Completa |  | 6548 | 24 | 1 |  |
| 626620 | Rol de pollo y cilantro 30g/u | Completa |  | 6559 | 23 | 1 |  |
| 6210820 | Rol de pollo y curry 30g/u | Completa |  | 6558 | 9 | 1 | Passos tallats a l'exportació |
| 246210824 | Rolls Pollo y Curry 50gr | Completa |  | 6557 | 0 | 1 | Passos no visibles a l'exportació |
| 24620124 | Roll de chocolate 50g/u | Completa |  | 6058 | 0 | 1 | Passos no visibles a l'exportació |
| 620120 | Roll de chocolate 30gr | Completa |  | 6351 | 0 | 1 | Passos no visibles a l'exportació |
| 6211724 | Roll de Choriqueso 50gr | Completa |  | 6457 | 0 | 1 | Passos no visibles a l'exportació |
| 6211124 | Rolls Arroz con Chipirones 50gr | Completa |  | 6151 | 0 | 0 | Passos no visibles a l'exportació |
| 267124 | Mini Piadina Jamón y Queso 50gr | Completa |  | 4672 | 0 | 1 | Passos no visibles a l'exportació |
| 6210720 | Rol de cerdo agridulce 30g/u | Completa |  | 6741 | 0 | 1 | Passos no visibles a l'exportació |
| 246210724 | Rol de cerdo agridulce 50g/u | Completa |  | 6740 | 0 | 0 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: kg_massa_palet=501.38, kg_farcit_palet=310.21<br>Dades sota un altre codi: `2462107204 (1 línia de recepta)`<br>Passos no visibles a l'exportació |
| 24620924 | Rol Toffe 50gr | Completa |  | 5763 | 0 | 1 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: codis R1381<br>Passos no visibles a l'exportació |
| 24621024 | Rol de manzana y pasas 50gr | Completa |  | 6269 | 0 | 0 | Passos no visibles a l'exportació |
| (buit) | Rol Manzana y Pasas 50gr | Sense codi |  | 6048 | 0 | 0 | ⚠ Codi buit; descripció gairebé igual a 24621024 |
| 24100932 | Crêpe Dulce de Leche 90gr | Completa |  | 4668 | 0 | 0 | ⚠ **Pot faltar una gravació o hi ha correcció manual**: codis R1381<br>Dades sota un altre codi: `1400932 (1 línia de recepta)`<br>Passos no visibles a l'exportació |
| 24101032 | Crêpe de manzana y pasas 90gr | Completa |  | 5186 | 0 | 0 | Passos no visibles a l'exportació |
| 24157036 | Crêpe de jamón y queso emental 110G/Unidad | Completa |  | 4300 | 0 | 1 | Molt semblant a 2478<br>Passos no visibles a l'exportació |
| 2478 | Crêpe de jamón y queso emmental 130gr | Completa |  | 4264 | 0 | 1 | Molt semblant a 24157036<br>Passos no visibles a l'exportació |
| 24157536 | Crep de Boletus 110gr | Completa |  | 4613 | 0 | 0 | Passos no visibles a l'exportació |
| 24155036 | Crêpe Champiñones, Bacon y Queso 110gr | Completa |  | 5022 | 0 | 1 | Molt semblant a 2502<br>Passos no visibles a l'exportació |
| 2502 | Crêpe Champiñones, Bacon y Queso 130gr | Completa |  | 4998 | 0 | 1 | Molt semblant a 24155036<br>Passos no visibles a l'exportació |
| 1511140 | Crêpe de arroz con chipirones 130gr | Completa |  | 4042 | 0 | 1 | Passos no visibles a l'exportació |
| 98226724 | Mini Burrito Snack Chili Carne 25gr | Completa |  | 5820 | 0 | 1 | Passos no visibles a l'exportació |
| 98246122 | Quesadilla Snack Cheddar y Jalapeño 20gr | Completa |  | 4864 | 0 | 1 | Passos no visibles a l'exportació |
| 625324 | Roll de espinacas, queso 50gr/u | Completa |  | 7222 | 0 | 1 | Passos no visibles a l'exportació |
| 2477 | Espinacas - Ricota - Bacon - Pasas y Piñon | Completa |  | 5726 | 0 | 1 | Molt semblant a 24155536<br>Passos no visibles a l'exportació |
| 24155536 | Crêpe Espinacas Ricota Bacon Pasas y Piñon | Completa |  | 5756 | 0 | 1 | Molt semblant a 2477<br>Passos no visibles a l'exportació |
| 2663 | Crêpe vieiras y gambas 130gr | Completa |  | 6203 | 0 | 1 | Molt semblant a 24158436<br>Passos no visibles a l'exportació |
| 24158436 | Crêpe de vieiras y gambas 110gr | Completa |  | 6221 | 0 | 1 | Molt semblant a 2663<br>Passos no visibles a l'exportació |
