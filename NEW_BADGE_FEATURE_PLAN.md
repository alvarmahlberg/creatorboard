# "NEW" Badge Feature - Top 100 Lista

## Tavoite
Lisätä "NEW" merkki sellaisten käyttäjien oheen, jotka ovat tulleet top 100 listalle viimeisen 3 päivän aikana.

## Vaihtoehdot

### Vaihtoehto A: Tietokanta (Suosittelema)
**Edytykset:**
- Pysyvä data, ei katoa palvelimen uudelleenkäynnistyksessä
- Skaalautuva ratkaisu
- Mahdollisuus tallentaa pitkää historiaa
- Varmuuskopiot mahdollisia

**Haitat:**
- Monimutkaisempi toteuttaa
- Vaatii tietokannan asennuksen ja ylläpidon

**Toteutustapa:**
- SQLite (yksinkertainen) tai PostgreSQL (skalautuva)
- Päivittäinen tallennus top 100 listasta
- Vertailu 3 päivän takaisiin dataan

### Vaihtoehto B: Tiedostopohjainen
**Edytykset:**
- Yksinkertainen toteuttaa
- Ei tietokantaa tarvita
- Data pysyy palvelimen uudelleenkäynnistyksessä

**Haitat:**
- Vähemmän skaalautuva
- Tiedostojen lukeminen/kirjoittaminen voi olla hidasta
- Ei samanaikaisia kirjoituksia

**Toteutustapa:**
- JSON-tiedostot päivittäin
- Tiedostojen hallinta ja puhdistus

### Vaihtoehto C: Redis/Muisti (Nopein)
**Edytykset:**
- Erittäin nopea
- Yksinkertainen toteuttaa
- Reaaliaikainen

**Haitat:**
- Data katoaa palvelimen uudelleenkäynnistyksessä
- Rajoitettu historia muistin mukaan
- Ei pysyvää tallennusta

**Toteutustapa:**
- In-memory Map JavaScript:issä
- Singleton pattern
- Automaattinen puhdistus vanhasta datasta

## Toteutustiedot

### Vaihtoehto C - Muistipohjainen (Yksinkertaisin)

#### Tiedostorakenne:
```
lib/
  history-store.ts     # Muistin hallinta
app/
  api/
    top-creators/
      route.ts         # Päivitetty API
  page.tsx             # Päivitetty UI
```

#### Koodiesimerkit:

**history-store.ts:**
```typescript
interface HistoryEntry {
  date: string; // YYYY-MM-DD
  top100: string[]; // Array of creator addresses
}

class HistoryStore {
  private history: Map<string, string[]> = new Map();
  private maxDays = 7;
  
  addEntry(date: string, top100Addresses: string[]) {
    this.history.set(date, top100Addresses);
    this.cleanup();
  }
  
  isNewInTop100(address: string, daysBack: number = 3): boolean {
    const targetDate = this.getDateDaysAgo(daysBack);
    const historicalTop100 = this.history.get(targetDate);
    
    if (!historicalTop100) return false;
    return !historicalTop100.includes(address);
  }
  
  private cleanup() {
    const dates = Array.from(this.history.keys()).sort();
    if (dates.length > this.maxDays) {
      const toRemove = dates.slice(0, dates.length - this.maxDays);
      toRemove.forEach(date => this.history.delete(date));
    }
  }
  
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

export const historyStore = new HistoryStore();
```

**API päivitys:**
```typescript
// app/api/top-creators/route.ts
import { historyStore } from "@/lib/history-store";

export async function GET() {
  try {
    const data = await fetchTopCreators();
    
    const dataWithNewFlag = data.items.map(coin => ({
      ...coin,
      isNew: historyStore.isNewInTop100(coin.address, 3)
    }));
    
    return NextResponse.json({ items: dataWithNewFlag });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
```

**UI päivitys:**
```typescript
// app/page.tsx
type CreatorCoin = {
  // ... existing fields ...
  isNew?: boolean;
};

// Taulukossa:
<div className="font-medium text-xs sm:text-sm truncate flex items-center gap-2">
  {coin.displayName || coin.name}
  {coin.isNew && (
    <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
      NEW
    </Badge>
  )}
</div>
```

## Seuraavat askeleet

1. **Päätä toteutustapa** - Suosittelema: Vaihtoehto C (muisti) alkuun, voi päivittää myöhemmin
2. **Toteuta historia-store** - Muistin hallinta
3. **Päivitä API** - Lisää isNew kenttä
4. **Päivitä UI** - Näytä NEW badge
5. **Testaa** - Varmista että toimii oikein

## Huomioitavaa

- Ensimmäisellä käynnistyksellä historia on tyhjä
- NEW merkit alkavat näkyä vasta seuraavista päivityksistä
- Muistin käyttö on minimaalinen (~700 stringiä)
- Voi helposti päivittää tietokantapohjaiseksi myöhemmin

## Tulevaisuuden parannukset

- Tietokantapohjainen ratkaisu pitkälle aikavälille
- Konfiguroitava aikaikkuna (esim. 1-7 päivää)
- Animoidut NEW merkit
- Tilastot uusista tulijoista
