# Läxförhör — flashcards (historia och geografi)

Ett läxförhör om de första flodkulturerna och om jordens inre och yttre krafter. Eleven skriver svaret med egna ord,
en AI rättar mot facit, och appen håller reda på vilka frågor som sitter och
vilka som behöver repeteras.

**Sidan ligger här:** https://aldur13.github.io/Flashcards/

Appens gränssnitt är en statisk webbplats. Multiplayer använder PeerJS först och
Supabase Realtime som reserv; konto och offentlig matchhistorik använder också
Supabase. Ingen egen server behöver byggas eller drivas av projektägaren.

## Version 4.1 – lärande, lagspel och åskådare

Den här versionen lägger till ett separat `flashcards-v41.js` så att befintliga
övnings- och konto-funktioner kan fortsätta användas utan att byggas om.

- **Smartare övning:** schemalagd repetition, dagens utmaning, nivå/kunskapsöversikt,
  märken, mörkt/ljust tema och ljudreglage.
- **Egna frågeset:** AI kan skapa skrivfrågor, flervalsfrågor och sant/falskt från
  anteckningar. Frågor kan exporteras och importeras som JSON.
- **AI-förklaring:** efter rättning kan eleven be om en stegvis förklaring.
- **Lagspelet:** 2v2, 4v4, 8v8 och 12v12. Varje lag har en gemensam svarsruta.
  Medlemmarna kan redigera den, och varje lagmedlem måste godkänna den aktuella
  versionen innan den låses. En ändring nollställer tidigare godkännanden.
- **Åskådarläge:** en separat observatörsingång med spelkod och observatörsnamn.
  Åskådare räknas inte som spelare och kan se svar som skrivs i realtid.
- **Matchhistorik:** historiken sparas lokalt och kan publiceras anonymt med
  frågor, svar, poäng och AI-feedback. Publicering kräver samtycke från värden
  och alla spelare samt att värden är inloggad på ett konto.
- **Versionsmärke:** `Flashcards v4.1` visas i nedre hörnet.

### Aktivera offentlig matchhistorik

1. Öppna Supabase Dashboard för projektet och välj **SQL Editor**.
2. Kör filen `supabase/v4.1-match-history.sql`.
3. Värden måste vara inloggad under **Konto** innan matchen avslutas för att
   historiken ska kunna publiceras. Utan inloggning sparas den lokalt på värdens
   enhet.
4. Offentlig historik är frivillig: värden och varje spelare måste aktivt godkänna
   publiceringen i lobbyn. Det går att spela utan att publicera; då stannar historiken
   lokalt hos värden. Namn ersätts med deltagar- eller lagnamn och e-post, telefonnummer
   och länkar filtreras bort. Skriv ändå aldrig privata uppgifter i ett svar.

### Multiplayer – viktiga begränsningar

- PeerJS är förstahandsanslutning och Supabase Realtime reserv. Båda kräver nät.
  Värdens webbläsare är fortfarande matchens auktoritet och måste vara öppen.
  Om värdens enhet eller flik stängs kan matchen inte fortsätta av sig själv.
- Lagspelet kräver exakt antal spelare, inklusive värden: 4 för 2v2, 8 för 4v4,
  16 för 8v8 och 24 för 12v12. Solo är fortfarande det vanliga individuella läget.
  Lagets text synkas medan man skriver; om flera personer skriver på exakt samma
  ställe samtidigt gäller den senaste synkade ändringen, inte teckenvis konfliktlösning.
- Markeringen **Turneringsmatch** sparas i historiken. Den här versionen har
  ännu inte ett automatiskt turneringsträd med grupper, semifinaler och final.
- Åskådarläget är en separat roll, inte en separat e-post-/lösenordskontotyp.
  Det använder en egen inloggningsvy med spelkod och observatörsnamn. Värden måste
  aktivt slå på åskådare i lobbyn innan någon kan titta.
- Matchhistorik är offentlig när den publiceras. Publicera bara när alla spelare
  förstår detta och har samtyckt. Anonymisering kan inte garantera att fritext
  aldrig innehåller ett personnamn eller annan identifierande detalj.
- Funktionerna har fått statiska kodtester och transporttester, men inte ett
  fullständigt test med många riktiga enheter och nätverk. Testa först med en
  liten privat match innan en större tävling.


### Paketet och GitHub-versionen

Den här ZIP-filen är byggd från en sparad projektkopia i arbetsytan. Jag har inte
kunnat verifiera att den är byte-för-byte samma som GitHub-committen `b9c24d7`.
Jämför/behåll därför eventuella nyare ändringar i GitHub innan du skriver över
hela projektmappen med ZIP-innehållet.

## Vad som finns i appen

- **Öva** — 164 frågor i 19 områden. Den frågar oftare om det du är osäker på.
- **Statistik** — hur stor del av materialet du kan, per område.
- **Register** — de frågor du svarat fel på, samlade för repetition.
- **AI** — vilken tjänst och nyckel som används.
- **Konto** (valfritt) — spara progressen i molnet och använd den på flera enheter. Se *Konton och molnprogress* längst ner.

Områdena är Jordbruksrevolutionen, Högkulturer, Historiska begrepp, Antikens
världar, Sumererna, Babylonien och Assyrien, Fenicierna, Judarna, Egypten och
Faraoner, samt (geografi) Jordens inre, Jordens plattor, Vulkaner, Jordbävningar, Bergarter, Yttre krafter och vittring, Vatten och hav, Vind, ras och skred och Inlandsisen och människan.

### Välj ämnen

Första gången sidan öppnas får man kryssa i vilka områden övningen ska hämta
frågor ur. Listan är numrerad och sorterad **svagast först**, så numret är
samtidigt rekommendationen: nummer 1 är det du kan sämst, och de tre svagaste
märks *rekommenderas*. Varje rad visar hur många frågor området har och hur
stor del du kan. Har man inte svarat på något ännu står listan i bokstavsordning
och ingenting rekommenderas — det finns inget att gå på då.

Knapparna **Alla ämnen** och **De tre svagaste** fyller i åt en. Valet sparas i
webbläsaren, och går att ändra när som helst genom att trycka på områdesnamnet
ovanför frågan (*Egypten · byt*).

Rättningen blir strängare ju bättre du kan en fråga (fem nivåer), och från
nivå 2 formuleras frågan om så att man inte kan lära sig facit utantill.
Allt du gjort sparas i din egen webbläsare — inget skickas till någon server
utom själva AI-tjänsten (och, om du själv väljer att logga in, din progress till ditt konto i molnet).

### Två namn på samma sak

Rättaren får uttryckligen veta att samma sak kan heta olika saker: Huang He och
Gula floden är en och samma flod, Ra och Re samma gud, Mesopotamien och
Tvåflodslandet samma område. Den kräver aldrig båda namnen, och räknar inte ett
alternativnamn som en egen post i en uppräkning. Ungefärliga årtal räcker, och
svenska eller engelska namn duger lika bra.

### Öppna frågor

Vissa frågor ber om exempel — *"Nämn två berömda egyptiska byggnader"*, *"Vad är
ett imperium? Ge exempel."* Där är facit bara ett par av många möjliga svar, och
Abu Simbel är ett lika riktigt svar som Karnak. Sådana kort märks med `oppen:1`
i `CARDS`, och då får rättaren veta att vilka sakligt korrekta exempel som helst
duger, att inget ska anges som saknat, och att detta går före strängheten på
höga nivåer. Är rättaren osäker på om ett exempel utanför facit stämmer ska den
eskalera till den starkare modellen istället för att chansa.

För bestämda frågor — vilka floder, vilket årtal, vad ett ord betyder — gäller
fortfarande att facit är svaret och ska täckas.

### Överklaga

Blev rättningen ändå fel finns knappen **Överklaga rättningen** under varje svar
som inte blev helt rätt. Man skriver en kort motivering, och då prövas fallet av
den kraftfullaste modell tjänsten har — `starkast` i `PROV`, till exempel
gpt-oss-120b hos Groq eller Gemini 2.5 Pro. Överdomaren ser frågan, facit,
elevens svar, den första rättningens dom och elevens argument, och avgör sakligt.
Den är instruerad att ge eleven rätt bara när argumentet faktiskt stämmer, inte
för att det är välformulerat.

Bifalls överklagandet räknas statistiken om från hur den såg ut *före*
rättningen, så att ett felaktigt minus inte blir kvar. Avslås den står den
första domen fast. En rättning kan överklagas en gång.

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

## Struktur och Språk-läge

- **Plugga**: frågorna är ordnade som ämne → kategori → område (se `STRUKTUR` i `index.html`).
  Nya frågor läggs i `CARDS`, och nya områden läggs in under rätt kategori i `STRUKTUR`.
- **Språk → Glosor**: tyska glosor från tyskboken, utan AI. De ligger i `GLOSOR` som rader
  `svenska # tyska` (alternativ skiljs med `;`). Substantiv skrivs med artikel (`der Zug`).
- **Nära-svar** (kan stängas av): är en bokstav fel, eller saknas stor bokstav eller artikel,
  får man veta att man är nära och prova igen.

## Tävla, profiler och säkerhet

**Tävla.** Värdens webbläsare är servern. Spelarna ansluter direkt till värden med en femtecknad kod (WebRTC via
PeerJS, som ligger i `peerjs.min.js` i repot så att inget skript laddas från tredje part). Värden väljer tid per
runda, antal rundor, högsta antal spelare och vilka kategorier frågorna hämtas från. Alla svar rättas i en enda
faktagranskning med den starkaste modellen (1–100 poäng) med **värdens egen AI-nyckel**. Webbsökning används om
leverantören stöder det (Groq, OpenRouter, Anthropic), annars rättas det utan sökning och resultatet visar det.

**Profiler.** Varje profil har egen progress i webbläsaren. "Min profil" använder samma lagring som tidigare, så
befintlig progress ligger kvar. Progress kan sparas som JSON-fil och laddas in som en ny profil (skriver aldrig
över något).

**Säkerhet.** AI-nycklar sparas bara i värdens webbläsare och skickas aldrig till spelarna. Namn och svar rensas och
visas som ren text. Meddelanden begränsas i storlek, typ och antal (ett svar per spelare och runda). Svaren
behandlas som data i prompten, så uppmaningar i ett svar ger 1 poäng. Spelare kan bara gå med innan spelet startar,
och värden kan ta bort spelare.

## Konton och molnprogress (steg 1)

Ett konto är **valfritt** och ersätter inte något: appen fungerar precis som förut utan inloggning. Med ett konto
sparas progressen också i molnet (Supabase), så att man kan fortsätta på en annan enhet. Allt ligger i `konto.js`
(en egen liten klient, ingen extern kod) och `supabase/setup.sql`. Saknas `konto.js` fungerar appen ändå.

**Så fungerar det**
- Varje konto får en egen lokal profil, `u` + 10 tecken. **Min profil rörs aldrig av sig själv.** Gammal progress
  flyttas in med knappen *Flytta in progress från Min profil* (den slår ihop, den skriver inte över).
- Synken sker några sekunder efter varje ändring, och när sidan öppnas. Den slår ihop **per fråga** med hjälp av tre
  lägen: den här enheten, molnet och senast synkade läget. Är bara en sida ändrad vinner den. Har båda ändrat samma
  fråga behålls den där du övat mest (`ratt + fel`). Rätta svar går alltså aldrig förlorade, och en nollställning
  (som tvingar molnet) och en överklagan som sänker en nivå fungerar också.
- Skrivningen till molnet är villkorad på radens `updated_at`. Har en annan enhet hunnit ändra emellan görs en ny runda.
- Allt som kommer från molnet rensas innan det används: bara frågenummer som siffror, heltal inom gränser, korta
  texter, inga okända fält. Tomma poster (0/0/0) räknas som "ingen post".
- Utloggning sparar först och tar sedan bort kontots lokala kopia, så att inget ligger kvar på en delad dator.
  Kan inte molnet nås frågar appen innan den loggar ut.
- Radera konto tar bort e-post, inloggning och molnprogress för gott (`delete_my_account()` i databasen).

**Det här behöver göras en gång i Supabase** (Dashboard för projektet `cicxvhjydsmgnysbkjlu`)
1. **SQL Editor** → klistra in hela `supabase/setup.sql` → *Run*. Det går bra att köra igen.
2. **Authentication → URL Configuration**: *Site URL* = `https://aldur13.github.io/Flashcards` och samma adress under
   *Redirect URLs*.
3. **Authentication → Sign In / Providers → Email**: *Minimum password length* = 10.
4. **Bekräfta e-post och mejlutskick, läs det här innan du bjuder in vänner:** Supabases inbyggda mejltjänst är bara
   till för test. Den skickar **bara till adresser som tillhör projektets organisation** och har en mycket låg gräns
   per timme. Vänner som skapar konto får alltså inget bekräftelsemejl, och inte heller något mejl för glömt
   lösenord. Det går att lösa med egen SMTP (Authentication → Emails → SMTP Settings, till exempel Brevo eller
   Resend, som har gratisnivåer). Lägg **inte** till vänner som medlemmar i organisationen för att komma runt det:
   medlemmar kommer åt hela projektet, inklusive databasen. Att stänga av *Confirm email* gör att inget mejl behövs
   för att skapa konto, men då bekräftas aldrig att adressen är äkta, och glömt lösenord fungerar fortfarande inte.

**Säkerhet och integritet**
- Nyckeln i `konto.js` är Supabase **publishable key**. Den är gjord för att ligga öppen i webbläsaren. Det som skyddar
  datan är radnivåsäkerheten (RLS) i `setup.sql`: bara den egna raden går att läsa och skriva, och den som inte är
  inloggad (`anon`) har inga rättigheter alls. Secret-nyckeln, `service_role` och databaslösenordet ska **aldrig**
  in i koden eller i en chatt.
- Inloggningsuppgifterna (en session) ligger i webbläsarens `localStorage`, som all annan progress. All text från
  molnet och från konton visas som ren text.
- Appen sparar e-postadresser (även vänners). En vuxen bör titta över Supabase-projektet och hur adresserna hanteras.
- GitHub-tokens som klistrats in i chattar ska raderas på github.com/settings/tokens. Nästa push kräver en ny
  *fine-grained* token: bara repot `Flashcards`, *Contents: read and write*, giltig en dag.

**Senare steg:** uppladdning av frågepaket som JSON (med validering och privata paket), därefter AI-anrop via en
serverfunktion och Supabase Realtime för Tävla.

## Tävla: reservanslutning

Tävla försöker först ansluta spelare direkt med PeerJS/WebRTC. Värden öppnar
samtidigt en Supabase Realtime-kanal för samma femteckenskod. Om en spelares
PeerJS-anslutning misslyckas efter flera försök växlar klienten automatiskt
till Realtime-kanalen. Realtime använder samma spelmeddelanden och värden
fortsätter att hantera svar och poäng. Supabase-konfigurationen återanvänds
från `konto.js`; ingen extra API-nyckel behövs.

Det här är en kostnadsfri reservväg inom Supabases gratiskvot, inte en garanti
om obegränsad gratis drift. Supabase-projektets Realtime-kvoter och eventuella
pausregler gäller. SDK:n laddas från jsDelivr, så reservvägen kräver att nätet
tillåter den domänen.

**TURN och databas-polling är inte aktiverade.** En tillförlitlig TURN-reläserver
kräver en egen eller extern relätjänst; det finns ingen stabil, officiell och
obegränsad gratis TURN-server att förlita sig på. Databas-polling kräver en
serverdel med säkra behörighetsregler och ska inte byggas genom att exponera
alla spelares svar i en öppet skrivbar tabell. Om Realtime inte fungerar visas
ett anslutningsfel i stället för att låtsas att en pollingreserv finns.
