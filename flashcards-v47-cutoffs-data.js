/* flashcards-v47-cutoffs-data.js — antagningspoäng till gymnasiet i Malmö.

   Det här är en START, inte alla Malmös gymnasier. Varje rad har en källa, ett år
   och ett datum för när den hämtades, och testerna kräver det. Så lägger du till
   eller uppdaterar en rad:
     1. Hitta siffran hos Skånegy (skanegy.se) eller Skolverkets Utbildningsguide
        (utbildningsguiden.skolverket.se), som visar "Lägsta" och "Medel".
     2. Lägg till en rad nedan med år, datum och länk. Skriv alltid ar (årets
        antagning) och datum (t.ex. "1 juli 2026").
     3. lagsta: null och alla: true betyder "Alla antagna" (ingen gräns).
     4. Kör testerna (cd test && npm test). De kollar att allt är ifyllt och att
        siffrorna är möjliga meritvärden (steg om 2,5).

   typ: nt = Natur/Teknik, sa = Samhälls/Humanistiska, hf = Ekonomi/Estetiska,
        yrke = yrkesprogram. Det styr behörighetskollen.
   kalla: 'skolverket' = Skolverkets Utbildningsguide, 'tredjepart' = en
        webbplats som visar Skånegys siffror (edu.se, Ednia). Ednia-rader har
        jämförts mot en andra källa där det gick; kontrollera alltid hos Skånegy. */
(function (root) {
  'use strict';

  var HAMTAD = '2026-11-26';
  var UG = 'Skolverkets Utbildningsguide';
  var EDU = 'Skånegy via edu.se';
  var EDNIA = 'Ednia';

  var RADER = [
    /* Skolverket, läge 1 juli 2026 */
    { skola: 'Praktiska Gymnasiet Malmö City', program: 'Barn- och fritidsprogrammet', typ: 'yrke', lagsta: 160, medel: 190.6, ar: 2026, datum: '1 juli 2026', kalla: 'skolverket', kallnamn: UG, url: 'https://utbildningsguiden.skolverket.se/gymnasieskola?schoolUnitID=25648215' },
    { skola: 'Praktiska Gymnasiet Malmö City', program: 'Industritekniska programmet', typ: 'yrke', lagsta: 115, medel: 144.2, ar: 2026, datum: '1 juli 2026', kalla: 'skolverket', kallnamn: UG, url: 'https://utbildningsguiden.skolverket.se/gymnasieskola?schoolUnitID=25648215' },
    { skola: 'Praktiska Gymnasiet Malmö City', program: 'VVS- och fastighetsprogrammet', typ: 'yrke', lagsta: 90, medel: 156.5, ar: 2026, datum: '1 juli 2026', kalla: 'skolverket', kallnamn: UG, url: 'https://utbildningsguiden.skolverket.se/gymnasieskola?schoolUnitID=25648215' },
    { skola: 'Malmö Citadellsgymnasium', program: 'Ekonomiprogrammet', typ: 'hf', lagsta: 220, medel: 246.6, ar: 2026, datum: '1 juli 2026', kalla: 'skolverket', kallnamn: UG, url: 'https://utbildningsguiden.skolverket.se/gymnasieskola?schoolUnitID=57072964' },
    { skola: 'Malmö Citadellsgymnasium', program: 'Samhällsvetenskapsprogrammet', typ: 'sa', lagsta: 245, medel: 263, ar: 2026, datum: '1 juli 2026', kalla: 'skolverket', kallnamn: UG, url: 'https://utbildningsguiden.skolverket.se/gymnasieskola?schoolUnitID=57072964' },
    { skola: 'Malmö Citadellsgymnasium', program: 'Teknikprogrammet', typ: 'nt', lagsta: 130, medel: 208.6, ar: 2026, datum: '1 juli 2026', kalla: 'skolverket', kallnamn: UG, url: 'https://utbildningsguiden.skolverket.se/gymnasieskola?schoolUnitID=57072964' },

    /* Skånegys siffror via edu.se */
    { skola: 'Malmö Borgarskola', program: 'Naturvetenskapsprogrammet', typ: 'nt', lagsta: 280, medel: 298, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDU, url: 'https://www.edu.se/gymnasieskolor/malmo-borgarskola-ro-1-30361243' },
    { skola: 'Malmö Borgarskola', program: 'Samhällsvetenskapsprogrammet', typ: 'sa', lagsta: 280, medel: 292, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDU, url: 'https://www.edu.se/gymnasieskolor/malmo-borgarskola-ro-1-30361243' },
    { skola: 'Malmö Borgarskola', program: 'Ekonomiprogrammet', typ: 'hf', lagsta: 265, medel: 283.5, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDU, url: 'https://www.edu.se/gymnasieskolor/malmo-borgarskola-ro-1-30361243' },
    { skola: 'Malmö Borgarskola', program: 'Hotell- och turismprogrammet', typ: 'yrke', lagsta: 232.5, medel: 251, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDU, url: 'https://www.edu.se/gymnasieskolor/malmo-borgarskola-ro-1-30361243' },
    { skola: 'Agnesfrids gymnasium', program: 'Fordons- och transportprogrammet', typ: 'yrke', lagsta: 87.5, medel: 158.5, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDU, url: 'https://www.edu.se/gymnasieskolor/agnesfrids-gymnasium-28770304' },
    { skola: 'Agnesfrids gymnasium', program: 'El- och energiprogrammet', typ: 'yrke', lagsta: 80, medel: null, ar: 2025, datum: 'antagningen 2025', kalla: 'tredjepart', kallnamn: EDU, url: 'https://www.edu.se/gymnasieskolor/agnesfrids-gymnasium-28770304' },

    /* Ednia (inofficiell sammanställning av Skånegys siffror) */
    { skola: 'Malmö Latinskola', program: 'Naturvetenskapsprogrammet', typ: 'nt', lagsta: 317.5, medel: null, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDNIA, url: 'https://ednia.se/gymnasium/malmo-latinskola' },
    { skola: 'Malmö Latinskola', program: 'Samhällsvetenskapsprogrammet', inriktning: 'Samhällsvetenskap', typ: 'sa', lagsta: 297.5, medel: null, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDNIA, url: 'https://ednia.se/gymnasium/malmo-latinskola' },
    { skola: 'Malmö Latinskola', program: 'Samhällsvetenskapsprogrammet', inriktning: 'Beteendevetenskap', typ: 'sa', lagsta: 302.5, medel: null, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDNIA, url: 'https://ednia.se/gymnasium/malmo-latinskola' },
    { skola: 'ProCivitas Privata Gymnasium Malmö', program: 'Naturvetenskapsprogrammet', typ: 'nt', lagsta: 320, medel: null, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDNIA, url: 'https://ednia.se/gymnasium/procivitas-privata-gymnasium-malmo' },
    { skola: 'ProCivitas Privata Gymnasium Malmö', program: 'Samhällsvetenskapsprogrammet', inriktning: 'Samhällsvetenskap', typ: 'sa', lagsta: 297.5, medel: null, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDNIA, url: 'https://ednia.se/gymnasium/procivitas-privata-gymnasium-malmo' },
    { skola: 'ProCivitas Privata Gymnasium Malmö', program: 'Samhällsvetenskapsprogrammet', inriktning: 'Beteendevetenskap', typ: 'sa', lagsta: 290, medel: null, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDNIA, url: 'https://ednia.se/gymnasium/procivitas-privata-gymnasium-malmo' },
    { skola: 'ProCivitas Privata Gymnasium Malmö', program: 'Ekonomiprogrammet', typ: 'hf', lagsta: 295, medel: null, ar: 2026, datum: 'antagningen 2026', kalla: 'tredjepart', kallnamn: EDNIA, url: 'https://ednia.se/gymnasium/procivitas-privata-gymnasium-malmo' }
  ];

  var DATA = { hamtad: HAMTAD, rader: RADER };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (root) root.MERIT_CUTOFFS = DATA;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
