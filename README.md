# Csitáry Office – Időpontfoglaló demó

Ez a repository a Csitáry Office univerzális időpontfoglaló rendszerének bemutató verzióját tartalmazza.

A demó különböző fiktív vállalkozásokon keresztül mutatja be:

- a vendégoldali időpontfoglalást;
- az adminfelületet;
- a foglalások kezelését;
- a különböző vállalkozástípusokra szabható működést.

A demó adatai ideiglenesen, a böngésző aktuális munkamenetében kerülnek kezelésre, és nem jelentenek valódi foglalást.

## Helyi futtatás

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

A build eredménye a `dist` könyvtárba kerül. A projekt közvetlenül importálható Vercelbe.
