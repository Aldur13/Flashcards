# Flodkulturerna — flashcards

Ett läxförhör om de första flodkulturerna. Eleven skriver svaret med egna ord,
en AI rättar mot facit, och appen håller reda på vilka frågor som sitter och
vilka som behöver repeteras.

**Sidan ligger här:** https://aldur13.github.io/flashcards/

Hela appen är en enda fil, `index.html`. Inget bygge, inga beroenden, ingen
server — den fungerar direkt i webbläsaren.

## Vad som finns i appen

- **Öva** — 42 frågor i sex områden. Den frågar oftare om det du är osäker på.
- **Statistik** — hur stor del av materialet du kan, per område.
- **Register** — de frågor du svarat fel på, samlade för repetition.
- **AI** — vilken tjänst och nyckel som används.

Rättningen blir strängare ju bättre du kan en fråga (fem nivåer), och från
nivå 2 formuleras frågan om så att man inte kan lära sig facit utantill.
Allt du gjort sparas i din egen webbläsare — inget skickas till någon server
utom själva AI-tjänsten.

## Nycklar

Appen kan hämta sin nyckel på två sätt, och båda fungerar samtidigt.

### 1. Delade nycklar (`keys.json`)

Sidan hämtar en lista med delade nycklar ur filen **`keys.json`**, som ligger
bredvid `index.html`. Alla som öppnar sidan får samma lista, så ingen behöver
skaffa något eget för att komma igång.

```json
{
  "nycklar": [
    { "namn": "Skolans Groq-nyckel", "prov": "groq", "key": "gsk_..." },
    { "namn": "Ellens Gemini-nyckel", "prov": "gemini", "key": "AIza..." }
  ]
}
```

`namn` är etiketten som visas i listan, `prov` är tjänsten (`groq`, `gemini`,
`kimi`, `anthropic`, `openai`, `mistral`, `openrouter`, `hf`) och `key` är
nyckeln. `model` och `model2` är valfria — utan dem används tjänstens
standardmodeller.

**Så lägger man till en nyckel:** under fliken **AI** finns *Lägg till en nyckel
som alla får*. Fyll i namn, tjänst och nyckel, tryck **Kopiera rad** och sedan
**Öppna keys.json** — GitHubs redigerare öppnas, klistra in raden bland de andra
och spara. Nyckeln är delad för alla nästa gång sidan laddas. Det går lika bra
att redigera `keys.json` direkt.

Vill man hellre lägga nycklarna i `index.html` finns arrayen `SHARED_KEYS` högst
upp i skriptet. Den slås ihop med listan från `keys.json`.

#### Hur sidan väljer nyckel

- Nycklarna provas uppifrån och ner. Blir en nyckel **avvisad** (fel nyckel,
  slut på krediter, modellen finns inte) hoppar sidan direkt vidare till nästa
  och gör om anropet — eleven märker ingenting.
- Den nyckel som svarar blir **standard**: nästa fråga, och nästa besök, börjar
  där. Det syns som *Används nu* i listan.
- En nyckel som bara är **överbelastad** (för många frågor på kort tid) döms inte
  ut. Den hoppas över i fem minuter och provas sedan igen.
- Är alla nycklar utdömda provar sidan hela listan igen istället för att ge upp,
  så en nyckel som börjar fungera igen fångas upp av sig själv.
- **Testa alla** under fliken AI pingar varje nyckel och visar vilka som lever.
- Minnet av vilka nycklar som slutat fungera är per webbläsare. Utan en server
  kan en elevs resultat inte nå de andra — var och en upptäcker en död nyckel
  första gången den används, och hoppar sedan över den.

> **Läs det här först.** `keys.json` är publik. Nycklarna där går att läsa av
> vem som helst som besöker sidan, och att använda till annat. Lägg **bara** in
> gratisnycklar utan betalkort — en Groq-nyckel från
> [console.groq.com](https://console.groq.com) eller en Gemini-nyckel från
> [aistudio.google.com](https://aistudio.google.com) kräver bara ett konto.
> Lägg **aldrig** in en nyckel som är kopplad till fakturering (OpenAI,
> Anthropic, Kimi) — då kan någon annan handla för dina pengar. Sidan hindrar
> det inte, men den varnar rött både i listan och när man lägger till.

### 2. Egen nyckel

Under fliken **AI** kan vem som helst välja *Egen nyckel* och klistra in sin
egen, för Groq, Gemini, OpenAI, Anthropic, Mistral, OpenRouter, Hugging Face
eller en modell man kör själv (Ollama, LM Studio).

- Nyckeln sparas i webbläsarens `localStorage` och finns kvar nästa gång man
  öppnar sidan — man behöver bara lägga in den en gång, per enhet.
- Den sparas så fort man lämnar fältet, även om man glömmer trycka **Spara**.
- Varje tjänst har sin egen sparade nyckel, så man kan byta fram och tillbaka.
- Under **Sparade nycklar** syns vilka som ligger sparade (maskerade) och när,
  med en **Ta bort**-knapp för varje.
- Nyckeln lämnar aldrig webbläsaren annat än till den tjänst man valt.

### När en nyckel inte fungerar

- Felmeddelandena säger vad som faktiskt är fel: nyckeln godtogs inte, för
  många frågor på kort tid, slut på krediter, modellen finns inte, eller att
  tjänsten är nere.
- En nyckel som avvisas flaggas, och en ruta på **Öva**-fliken talar om det
  istället för att rättningen bara tystnar.
- Finns delade nycklar tar de över automatiskt när elevens egen nyckel inte
  godtas, så pluggandet aldrig stannar. Rättningen märks då med
  *"rättad med den delade nyckeln"*.
- **Testa**-knappen under fliken AI gör ett riktigt anrop och rapporterar
  utfallet. **Visa logg** visar de senaste anropen om något krånglar.

## Publicera sidan

Den ligger på GitHub Pages:

1. **Settings → Pages**
2. **Source:** Deploy from a branch
3. Branch: `claude/website-launch-setup-u4g39j`, mapp `/ (root)` → **Save**

Sidan är uppe efter någon minut. Varje push till grenen uppdaterar den.

## Ändra frågorna

Frågorna ligger i `CARDS` i `index.html`, en rad per fråga:

```js
{id:1,k:"Jordbruksrevolutionen",q:"Vad levde människan av …?",a:"Hon var jägare och samlare. …"}
```

`k` är områdesnamnet som visas i statistiken, `q` frågan och `a` facit som
AI:n rättar mot. Lägg till, ta bort eller skriv om fritt — `id` ska vara unikt.

## Köra lokalt

```
python3 -m http.server 8000
```

och öppna http://localhost:8000. (Att dubbelklicka på filen fungerar inte:
webbläsaren blockerar anrop till AI-tjänster från `file://`.)
