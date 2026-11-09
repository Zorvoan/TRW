# TRW Racing

Statická webová prezentace závodního týmu **TRW** v motorsportovém stylu:
startovní světla, živá telemetrie, timing tower, kalendář závodů a sekce,
které se načítají až ve chvíli, kdy k nim uživatel doscrolluje.

## Struktura

```
index.html            # celá stránka (hero, tým, programy, jezdci, kalendář, palmarès, news, partneři, CTA)
assets/css/style.css  # design systém — tokeny, sekce, responzivita
assets/js/main.js     # veškeré interakce (bez závislostí)
```

## Spuštění

Žádný build, žádné závislosti:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Co je uvnitř

**Úvod a hero**
- preloader ve stylu startovních světel (5 sloupců, náhodná pauza, „Lights out“); klik nebo klávesa ho přeskočí
- nadpis se rozjíždí po písmenech, na pozadí canvas se „speed streaks“
- telemetrický panel: auto objíždí trať, rychlost se počítá z křivosti trati
  (brzdné zóny, akcelerace), z ní převodový stupeň, shift lights a časy sektorů
  barvené jako v časomíře (fialová = nejlepší, zelená = osobní, žlutá = pomalejší)
- odpočet do dalšího závodu

**Sekce**
- „697 HP“: sticky sekce, kde fotka prosvítá jen nápisem; scroll ho zvedne doprostřed, pak se přiblíží do písmene H, až fotka zaplní obrazovku
- střídání černých, bílých a cihlově červených sekcí, za nadpisy obří „ghost“ text posouvaný scrollem
- pruh s dalším závodem: odpočet v černých boxech a obrys trati, který se dokreslí
- garáž: karusel vozů (SVG), další auto přijede s roztočenými koly; šipky, tečky, klávesnice, swipe
- jezdci: karty s helmou a přepínáním sezón 2026 / 2025 / 2024

**Scroll loading & animace**
- sekce s `data-lazy` (jezdci, kalendář, news, partneři) čekají za „pit boardem“,
  po doscrollování se „načtou“ a jejich položky (`data-stagger`) najedou postupně
- scroll reveal přes `IntersectionObserver` se zpožděním (`data-delay`)
- progress „kola“ nahoře se značkami sektorů a HUD vlevo dole (S1/S2/S3 + aktuální sekce)
- časová osa palmarès se vyplňuje podle scrollu, čítače statistik, nekonečné marquee
- vlající šachovnicová vlajka (canvas) v CTA

**Interaktivní části**
- taby programů (šipky na klávesnici fungují), filtrování novinek, validace e-mailu,
  mobilní off-canvas menu

**Přístupnost a výkon**
- bez JS je vše viditelné (skrývání řídí třída `.js`)
- respektuje `prefers-reduced-motion`
- animace na canvasu a telemetrie běží jen když jsou vidět
- responzivní od 360 px, bez horizontálního přetečení; žádné obrázky — vizuály jsou CSS/SVG/canvas

## Barevná paleta

Všechny barvy jsou definované jednou, v `:root` na začátku `assets/css/style.css`
(i SVG ilustrace a canvas animace z nich čtou). Průhledné varianty se píšou jako
`rgb(var(--red-rgb) / .5)`, takže zůstávají v paletě.

| Skupina | Token | Hodnota | Použití |
|---|---|---|---|
| Carbon | `--c-carbon-900` | `#08090c` | pozadí stránky |
| | `--c-carbon-800` | `#0f1116` | zvýšená plocha |
| | `--c-carbon-700` | `#161920` | karty |
| | `--c-carbon-600` | `#1e222b` | hover plochy |
| | `--c-pitch` | `#0b0b0d` | odpočet, tmavá tlačítka, pásky |
| | `--c-graphite` | `#3a404c` | livery GTWC |
| | `--c-steel` | `#8b909c` | tlumený text na tmavé |
| Paper | `--c-white` | `#ffffff` | bílé sekce, text na červené |
| | `--c-snow` | `#f2f3f5` | text na tmavé |
| | `--c-mist` | `#f5f6f8` | plochy v bílých sekcích |
| Brand | `--c-red` | `#e4002b` | akcent, primární tlačítka |
| | `--c-red-glow` | `#ff2240` | světla, záře |
| | `--c-ember` | `#ff6a3d` | horký konec každé svítící linky |
| | `--c-brick` | `#c8372d` | červené sekce |
| | `--c-gold` | `#d9a43a` | livery GT |
| | `--c-blue` | `#3c63a8` | livery LMGT3 |
| Timing | `--c-purple` | `#b14dff` | nejrychlejší |
| | `--c-green` | `#19d46b` | osobní nejlepší / hotovo |
| | `--c-yellow` | `#ffd400` | pomalejší / vítězství |

## Poznámky

- Fonty (Saira Condensed, Saira, JetBrains Mono) se načítají z Google Fonts.
- Jména jezdců, časy, výsledky a novinky jsou ukázkový obsah.
