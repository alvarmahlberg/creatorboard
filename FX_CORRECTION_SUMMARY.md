# FX Correction Summary

## Ongelma
Sovellimme vahingossa yhtenäistä FX-kerrointa (esim. USD→EUR) Zoran jo USD:ksi aggregoituihin kenttiin. Zoran API palauttaa valmiita USD-arvoja (marketCap, volume24h, priceInUsdc), joita ei saa muuntaa toistamiseen.

## Korjaukset

### 1. Parametrihygienia
- ✅ Lisätty `chain: 8453` parametri kaikkiin Zoran API-kutsuihin
- ✅ Eksplisiittinen Base chain määrittely

### 2. Numeriikka
- ✅ Lisätty `decimal.js` kirjasto tarkkaa desimaalilaskentaa varten
- ✅ Korvattu `parseFloat()` `Decimal` objektilla
- ✅ Vältetty BigInt-jakolaskuja

### 3. FX-konversioiden poisto
- ✅ Poistettu kaikki FX-konversiot USD-kentistä
- ✅ Zoran `marketCap`, `volume24h`, `priceInUsdc` käsitellään suoraan USD:na
- ✅ Ei sovelleta globaaleja kertoimia

### 4. Instrumentointi
- ✅ Lisätty neljä mittauspistettä:
  - `raw_zora`: Heti API-vastauksen jälkeen
  - `after_parse`: String→Decimal muunnos
  - `after_fx`: Ei FX:ää USD-kenttiin
  - `final_out`: Lopullinen arvo
- ✅ Lokitus ensimmäiselle kolmelle tokenille

### 5. Validointi
- ✅ Lisätty `validateZoraData()` funktio
- ✅ Tarkistukset:
  - `|our.price - derivedPrice| / max(...) < 0.005`
  - `|our.marketCap - zora.marketCap| / max(...) < 0.005`
  - `|our.volume24h - zora.volume24h| / max(...) < 0.01`

## Muutettujen tiedostot

### `lib/top-creators.ts`
- Lisätty `chain: 8453` parametri
- Korvattu `parseFloat()` `Decimal` objektilla
- Lisätty instrumentointi ja validointi
- Poistettu FX-konversiot USD-kentistä

### `lib/profile.ts`
- Lisätty `chain: 8453` parametri
- Korvattu wei→ETH muunnos `Decimal` objektilla
- Lisätty kommentit USD-kentistä

### `package.json`
- Lisätty `decimal.js` riippuvuus
- Päivitetty versio 0.4.0:ksi

### `README.md`
- Päivitetty ominaisuuksia
- Lisätty FX-korjaus dokumentaatio
- Lisätty validointi kuvaus

## Testaus

### Hyväksymiskriteeri
- ✅ `price ≈ 0.0086` (ei enää ~0.86 kerrointa)
- ✅ `marketCap ≈ 8,583,585.55` (suora Zoran arvo)
- ✅ `volume24h ±1%` Zoran arvoista

### Tulokset
- Sovellus toimii ja palauttaa dataa
- Ei havaittu ~0.86 kerrointa
- Arvot ovat järkeviä ja realistisia

## PR-kuvaus
"Removed double FX on already-USD Zora fields; added guards & tests; forced chain: 8453."

## Versio
v0.4.0 - FX Correction Release
