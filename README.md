# TRW Racing

Statická webová prezentace závodního týmu **TRW** — replika stylu stránky
`w-racingteam.com/racing`: ostré hrany, zkosené tvary, racing typografie,
černo-červená paleta, scroll loading a animace.

## Struktura

```
index.html            # celá stránka (hero, programy, jezdci, palmarès, news, partneři, CTA)
assets/css/style.css  # design systém — tokeny, sekce, responzivita
assets/js/main.js     # veškeré interakce (bez závislostí)
```

## Spuštění

Žádný build, žádné závislosti. Stačí otevřít `index.html`, nebo pro jistotu
(kvůli relativním cestám) spustit statický server:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Co je uvnitř

**Scroll loading & animace**
- úvodní preloader s počítadlem 0–100 % a lamelovým („shutter“) odkrytím stránky
- scroll reveal přes `IntersectionObserver` se stagger prodlevami (`data-delay`)
- progress bar průběhu scrollu v hlavičce
- dopočítávaná čísla statistik (74 titulů, 312 vítězství…)
- parallax vrstvy v heru a v CTA (`data-parallax`)
- hero nadpis s postupným náběhem slov, speed-lines, animované SVG auto
- nekonečné tickery (championshipy, loga partnerů)
- vlastní kurzor s popiskem podle prvku (`data-cursor="view|read|link"`)
- auto-skrývající se hlavička, zvýraznění aktivní sekce, tlačítko zpět nahoru

**Interaktivní části**
- taby programů (WEC Hypercar / LMGT3 / GTWC / IGTC) s posuvným podtržením
- filtrování novinek podle kategorie
- odpočet do dalšího závodu
- validace e-mailu v kontaktním formuláři
- mobilní off-canvas menu

**Přístupnost a výkon**
- plně respektuje `prefers-reduced-motion` (animace se vypnou)
- responzivní od 360 px výš, bez horizontálního přetečení
- vizuály jsou generované CSS/SVG — stránka nenačítá žádné obrázky

## Poznámky

- Fonty (Barlow Condensed, Chakra Petch) se načítají z Google Fonts; bez
  připojení stránka spadne na systémové bezpatkové písmo.
- Texty, jména jezdců a novinky jsou ukázkový obsah — připraveno k výměně
  za reálná data.
