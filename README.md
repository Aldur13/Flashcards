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

### 1. Delad nyckel (valfritt)

Lägg in en nyckel i `index.html` så fungerar sidan direkt för alla som
besöker den, utan att någon behöver skaffa något eget. Leta upp raden:

```js
const SHARED={prov:'groq',key:'',model:'openai/gpt-oss-20b',model2:'openai/gpt-oss-120b'};
```

och skriv in nyckeln mellan citattecknen efter `key:`. Lämna den tom för att
stänga av delad nyckel.

> **Läs det här först.** Sidan är publik, så en nyckel som ligger i filen går
> att läsa i källkoden av vem som helst som besöker sidan. Använd **bara** en
> gratisnyckel utan betalkort — en Groq-nyckel från
> [console.groq.com](https://console.groq.com) kräver bara en e-postadress.
> Lägg **aldrig** in en nyckel som är kopplad till fakturering (OpenAI,
> Anthropic, Kimi), då kan någon annan handla för dina pengar.

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
- Finns en delad nyckel tar den över automatiskt när elevens egen nyckel inte
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
