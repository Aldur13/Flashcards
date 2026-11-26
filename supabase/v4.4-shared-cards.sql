-- ============================================================================
--  Flashcards v4.4: delade kort (universella, öppna för alla att läsa)
--  Körs automatiskt av GitHub Actions (.github/workflows/apply-sql.yml),
--  så du behöver inte SQL Editor. Filen går att köra flera gånger.
--
--   * Alla får läsa korten (även utan konto), bara inloggade får lägga till.
--   * Varje kort MÅSTE ha ett ämne (väljs ur en fast lista) och ett område.
--   * Man kan bara ta bort sina egna kort. Kort blir kvar om kontot raderas.
--   * Kolumnen dolt: sätt den till true i Supabase Table Editor för att
--     gömma ett olämpligt kort för alla, utan att radera det.
-- ============================================================================

create table if not exists public.shared_cards (
  nr         bigint generated always as identity primary key,
  owner_id   uuid default auth.uid() references auth.users (id) on delete set null,
  subject    text not null,
  category   text not null,
  q          text not null,
  a          text not null,
  oppen      boolean not null default false,
  dolt       boolean not null default false,
  q_norm     text generated always as (lower(btrim(q))) stored,
  created_at timestamptz not null default now(),
  constraint shared_cards_subject_ok check (subject in ('Biologi', 'Fysik', 'Kemi', 'Teknik', 'Matematik', 'Historia', 'Geografi', 'Religion', 'Samhällskunskap', 'Svenska', 'Engelska', 'Tyska', 'Franska', 'Spanska', 'Musik', 'Idrott och hälsa', 'Bild', 'Slöjd', 'Hem- och konsumentkunskap', 'Övrigt')),
  constraint shared_cards_category_len check (char_length(btrim(category)) between 2 and 60),
  constraint shared_cards_q_len check (char_length(btrim(q)) between 3 and 240),
  constraint shared_cards_a_len check (char_length(btrim(a)) between 1 and 900),
  constraint shared_cards_unik unique (subject, q_norm)
);

create index if not exists shared_cards_subject_idx on public.shared_cards (subject, category);

alter table public.shared_cards enable row level security;

drop policy if exists "shared_cards_las" on public.shared_cards;
drop policy if exists "shared_cards_skapa" on public.shared_cards;
drop policy if exists "shared_cards_ta_bort" on public.shared_cards;

create policy "shared_cards_las" on public.shared_cards
  for select to anon, authenticated using (dolt = false);

create policy "shared_cards_skapa" on public.shared_cards
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and dolt = false);

create policy "shared_cards_ta_bort" on public.shared_cards
  for delete to authenticated using (owner_id = (select auth.uid()));

revoke all on public.shared_cards from public, anon, authenticated;
grant select (nr, subject, category, q, a, oppen, dolt, created_at) on public.shared_cards to anon, authenticated;
grant select (owner_id) on public.shared_cards to authenticated;
grant insert (subject, category, q, a, oppen) on public.shared_cards to authenticated;
grant delete on public.shared_cards to authenticated;

-- Städar texten och stoppar missbruk: max 2000 kort per konto, max 600 per timme.
create or replace function public.shared_cards_fore_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.category := btrim(new.category);
  new.q := btrim(new.q);
  new.a := btrim(new.a);
  if new.owner_id is not null then
    if (select count(*) from public.shared_cards where owner_id = new.owner_id) >= 2000 then
      raise exception 'Du har redan lagt upp 2000 kort, det är max.' using errcode = '54000';
    end if;
    if (select count(*) from public.shared_cards
          where owner_id = new.owner_id and created_at > now() - interval '1 hour') >= 600 then
      raise exception 'Du har lagt upp många kort den senaste timmen. Vänta en stund.' using errcode = '54000';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.shared_cards_fore_insert() from public, anon, authenticated;

drop trigger if exists shared_cards_fore_insert on public.shared_cards;
create trigger shared_cards_fore_insert
  before insert on public.shared_cards
  for each row execute function public.shared_cards_fore_insert();

-- Startkort: Biologi (matspjälkning, andning, lever, njurar). Utan ägare.
insert into public.shared_cards (subject, category, q, a) values
  ('Biologi','Näringsämnen','Vad är näringsämnen?','Ämnen i maten som kroppen behöver för att få energi, växa och fungera.'),
  ('Biologi','Näringsämnen','Vilka är de viktigaste näringsämnena?','Kolhydrater, fett, proteiner, vitaminer, mineraler och vatten.'),
  ('Biologi','Näringsämnen','Vad används kolhydrater främst till?','De ger kroppen energi.'),
  ('Biologi','Näringsämnen','Vad används fett till i kroppen?','Fett ger och lagrar energi, skyddar organ och hjälper kroppen att hålla värmen.'),
  ('Biologi','Näringsämnen','Vad används proteiner till?','Proteiner behövs bland annat för att bygga upp och reparera kroppens celler och vävnader.'),
  ('Biologi','Näringsämnen','Varför behöver kroppen vitaminer och mineraler?','De behövs för att kroppens olika funktioner ska fungera.'),
  ('Biologi','Näringsämnen','Varför behöver kroppen vatten?','Vatten behövs bland annat för att transportera ämnen och reglera kroppstemperaturen.'),
  ('Biologi','Matspjälkningen','Vad är matspjälkning?','När maten bryts ner till mindre ämnen som kroppen kan ta upp.'),
  ('Biologi','Matspjälkningen','Var börjar matspjälkningen?','I munnen.'),
  ('Biologi','Matspjälkningen','Vad händer med maten i munnen?','Tänderna tuggar sönder maten och saliven blandas med den.'),
  ('Biologi','Matspjälkningen','Vad gör saliven?','Den gör maten lättare att svälja och innehåller enzym som börjar bryta ner stärkelse.'),
  ('Biologi','Matspjälkningen','Vad är enzymer?','Ämnen som hjälper kemiska reaktioner, till exempel nedbrytningen av maten, att gå snabbare.'),
  ('Biologi','Matspjälkningen','Vad händer med maten i matstrupen?','Maten transporteras till magsäcken med hjälp av muskelsammandragningar.'),
  ('Biologi','Matspjälkningen','Vad gör magsäcken?','Den knådar maten och blandar den med magsaft.'),
  ('Biologi','Matspjälkningen','Varför finns magsyra i magsäcken?','Den hjälper till att bryta ner maten och dödar många mikroorganismer.'),
  ('Biologi','Matspjälkningen','Vad händer i tunntarmen?','Maten bryts ner färdigt och näringsämnen tas upp genom tarmväggen till blodet.'),
  ('Biologi','Matspjälkningen','Vad är tarmludd?','Små utskott i tunntarmen som gör ytan större så att näringsämnen kan tas upp effektivt.'),
  ('Biologi','Matspjälkningen','Vad händer i tjocktarmen?','Vatten tas upp från det som är kvar av maten.'),
  ('Biologi','Ämnesomsättning och cellandning','Vad är ämnesomsättning?','Kroppens alla kemiska reaktioner, där ämnen byggs upp och bryts ner.'),
  ('Biologi','Ämnesomsättning och cellandning','Vad är cellandning?','När cellerna använder druvsocker och syre för att frigöra energi. Då bildas koldioxid och vatten.'),
  ('Biologi','Ämnesomsättning och cellandning','Vilka ämnen behövs vid cellandning?','Druvsocker och syre.'),
  ('Biologi','Ämnesomsättning och cellandning','Vilka ämnen bildas vid cellandning?','Koldioxid, vatten och energi frigörs.'),
  ('Biologi','Ämnesomsättning och cellandning','Varför behöver kroppen syre?','Syre behövs för cellandningen så att cellerna kan frigöra energi ur näringen.'),
  ('Biologi','Andningen','Vilka organ ingår i andningsvägarna?','Bland annat näsan eller munnen, svalget, struphuvudet, luftstrupen, luftrören och lungorna.'),
  ('Biologi','Andningen','Vad händer med luften i näsan?','Luften värms, fuktas och renas från en del partiklar.'),
  ('Biologi','Andningen','Vad är luftstrupens uppgift?','Att leda luften vidare mot lungorna.'),
  ('Biologi','Andningen','Vad händer med luftstrupen i bröstkorgen?','Den delar sig i två huvudluftrör, ett till varje lunga.'),
  ('Biologi','Andningen','Vad är luftrörens uppgift?','De leder luften vidare och förgrenar sig i allt mindre luftrör i lungorna.'),
  ('Biologi','Andningen','Vad är lungblåsor?','Små blåsor längst ut i de minsta luftrören där gasutbytet sker.'),
  ('Biologi','Andningen','Varför finns det så många lungblåsor?','De ger lungorna en mycket stor yta för gasutbyte.'),
  ('Biologi','Andningen','Vad händer vid gasutbytet i lungblåsorna?','Syre går från luften i lungblåsorna till blodet, och koldioxid går från blodet till lungblåsorna.'),
  ('Biologi','Andningen','Varför har lungblåsorna tunna väggar?','Det gör att syre och koldioxid lätt kan passera mellan luften och blodet.'),
  ('Biologi','Andningen','Vilka blodkärl finns runt lungblåsorna?','Små blodkärl som kallas kapillärer.'),
  ('Biologi','Andningen','Vad transporterar blodet från lungorna till kroppens celler?','Främst syre.'),
  ('Biologi','Andningen','Vad transporterar blodet från kroppens celler till lungorna?','Koldioxid.'),
  ('Biologi','Andningen','Vad händer när man andas in?','Bröstkorgen vidgas, diafragman dras nedåt och luft strömmar in i lungorna.'),
  ('Biologi','Andningen','Vad händer när man andas ut?','Bröstkorgen minskar i volym, diafragman slappnar av och luft strömmar ut ur lungorna.'),
  ('Biologi','Andningen','Vilken muskel är särskilt viktig vid andning?','Diafragman.'),
  ('Biologi','Andningen','Vad är diafragman?','En kupolformad muskel under lungorna som hjälper till att ändra bröstkorgens volym.'),
  ('Biologi','Andningen','Varför innehåller utandningsluft mer koldioxid än inandningsluft?','Kroppens celler bildar koldioxid vid cellandningen, och blodet transporterar den till lungorna.'),
  ('Biologi','Andningen','Innehåller utandningsluft vatten?','Ja, utandningsluften innehåller vattenånga.'),
  ('Biologi','Levern','Vad är leverns uppgifter?','Levern bearbetar näringsämnen, lagrar vissa ämnen och hjälper till att bryta ner skadliga ämnen.'),
  ('Biologi','Levern','Vad bildar levern som hjälper till med fettspjälkningen?','Galla.'),
  ('Biologi','Levern','Vad gör gallan?','Den finfördelar fett i små droppar så att enzymer lättare kan bryta ner det.'),
  ('Biologi','Njurar och urinvägar','Vilka är njurarnas viktigaste uppgifter?','De renar blodet från avfallsämnen och reglerar bland annat mängden vatten och salter.'),
  ('Biologi','Njurar och urinvägar','Var sitter njurarna?','På varsin sida om ryggraden, ungefär i höjd med midjan.'),
  ('Biologi','Njurar och urinvägar','Vad bildas i njurarna?','Urin.'),
  ('Biologi','Njurar och urinvägar','Vad innehåller urin?','Främst vatten och avfallsämnen, bland annat urinämne, samt salter.'),
  ('Biologi','Njurar och urinvägar','Vad är nefron?','En liten funktionell enhet i njuren där blodet filtreras och urin bildas.'),
  ('Biologi','Njurar och urinvägar','Vad händer när blodet filtreras i njurarna?','Vatten och små lösta ämnen filtreras från blodet. Ämnen kroppen behöver tas i stor utsträckning tillbaka till blodet.'),
  ('Biologi','Njurar och urinvägar','Vilken uppgift har urinledarna?','De leder urinen från njurarna till urinblåsan.'),
  ('Biologi','Njurar och urinvägar','Vad gör urinblåsan?','Den lagrar urinen tills den lämnar kroppen.'),
  ('Biologi','Njurar och urinvägar','Vilken uppgift har urinröret?','Det leder urinen från urinblåsan ut ur kroppen.')
on conflict (subject, q_norm) do nothing;
