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

## Poznámky

- Fonty (Saira Condensed, Saira, JetBrains Mono) se načítají z Google Fonts.
- Jména jezdců, časy, výsledky a novinky jsou ukázkový obsah.
