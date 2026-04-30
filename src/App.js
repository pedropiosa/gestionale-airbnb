import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// STATUS PRENOTAZIONE
// ═══════════════════════════════════════════════════════════════
const STATUSES = {
  draft:     { label: "Bozza",     emoji: "📝", color: "#888888" },
  ready:     { label: "Pronta",    emoji: "✅", color: "#4caf50" },
  sent:      { label: "Inviata",   emoji: "📤", color: "#2196f3" },
  accepted:  { label: "Accettata", emoji: "✓",  color: "#00c853" },
  error:     { label: "Errore",    emoji: "❌", color: "#f44336" },
  cancelled: { label: "Annullata", emoji: "🚫", color: "#9e9e9e" },
};
const STATUS_KEYS = Object.keys(STATUSES);

// Paesi ISO accettati da SDI (fonte: specifiche AdE Allegato A)
const PAESI_ISO = [
  ["AF","Afghanistan"],["AL","Albania"],["DZ","Algeria"],["AD","Andorra"],["AO","Angola"],
  ["AG","Antigua e Barbuda"],["AR","Argentina"],["AM","Armenia"],["AU","Australia"],["AT","Austria"],
  ["AZ","Azerbaigian"],["BS","Bahamas"],["BH","Bahrain"],["BD","Bangladesh"],["BB","Barbados"],
  ["BY","Bielorussia"],["BE","Belgio"],["BZ","Belize"],["BJ","Benin"],["BT","Bhutan"],
  ["BO","Bolivia"],["BA","Bosnia Erzegovina"],["BW","Botswana"],["BR","Brasile"],["BN","Brunei"],
  ["BG","Bulgaria"],["BF","Burkina Faso"],["BI","Burundi"],["CV","Capo Verde"],["KH","Cambogia"],
  ["CM","Camerun"],["CA","Canada"],["CF","Rep. Centrafricana"],["TD","Ciad"],["CL","Cile"],
  ["CN","Cina"],["CO","Colombia"],["KM","Comore"],["CG","Congo"],["CD","Congo RD"],
  ["CR","Costa Rica"],["HR","Croazia"],["CU","Cuba"],["CY","Cipro"],["CZ","Rep. Ceca"],
  ["DK","Danimarca"],["DJ","Gibuti"],["DM","Dominica"],["DO","Rep. Dominicana"],["EC","Ecuador"],
  ["EG","Egitto"],["SV","El Salvador"],["GQ","Guinea Equatoriale"],["ER","Eritrea"],["EE","Estonia"],
  ["SZ","Eswatini"],["ET","Etiopia"],["FJ","Figi"],["FI","Finlandia"],["FR","Francia"],
  ["GA","Gabon"],["GM","Gambia"],["GE","Georgia"],["DE","Germania"],["GH","Ghana"],
  ["GR","Grecia"],["GD","Grenada"],["GT","Guatemala"],["GN","Guinea"],["GW","Guinea-Bissau"],
  ["GY","Guyana"],["HT","Haiti"],["HN","Honduras"],["HU","Ungheria"],["IS","Islanda"],
  ["IN","India"],["ID","Indonesia"],["IR","Iran"],["IQ","Iraq"],["IE","Irlanda"],
  ["IL","Israele"],["IT","Italia"],["JM","Giamaica"],["JP","Giappone"],["JO","Giordania"],
  ["KZ","Kazakhstan"],["KE","Kenya"],["KI","Kiribati"],["KP","Corea del Nord"],["KR","Corea del Sud"],
  ["KW","Kuwait"],["KG","Kirghizistan"],["LA","Laos"],["LV","Lettonia"],["LB","Libano"],
  ["LS","Lesotho"],["LR","Liberia"],["LY","Libia"],["LI","Liechtenstein"],["LT","Lituania"],
  ["LU","Lussemburgo"],["MG","Madagascar"],["MW","Malawi"],["MY","Malaysia"],["MV","Maldive"],
  ["ML","Mali"],["MT","Malta"],["MH","Isole Marshall"],["MR","Mauritania"],["MU","Mauritius"],
  ["MX","Messico"],["FM","Micronesia"],["MD","Moldavia"],["MC","Monaco"],["MN","Mongolia"],
  ["ME","Montenegro"],["MA","Marocco"],["MZ","Mozambico"],["MM","Myanmar"],["NA","Namibia"],
  ["NR","Nauru"],["NP","Nepal"],["NL","Paesi Bassi"],["NZ","Nuova Zelanda"],["NI","Nicaragua"],
  ["NE","Niger"],["NG","Nigeria"],["MK","Macedonia del Nord"],["NO","Norvegia"],["OM","Oman"],
  ["PK","Pakistan"],["PW","Palau"],["PA","Panama"],["PG","Papua Nuova Guinea"],["PY","Paraguay"],
  ["PE","Perù"],["PH","Filippine"],["PL","Polonia"],["PT","Portogallo"],["QA","Qatar"],
  ["RO","Romania"],["RU","Russia"],["RW","Ruanda"],["KN","Saint Kitts e Nevis"],["LC","Saint Lucia"],
  ["VC","Saint Vincent e Grenadine"],["WS","Samoa"],["SM","San Marino"],["ST","São Tomé e Príncipe"],
  ["SA","Arabia Saudita"],["SN","Senegal"],["RS","Serbia"],["SC","Seychelles"],["SL","Sierra Leone"],
  ["SG","Singapore"],["SK","Slovacchia"],["SI","Slovenia"],["SB","Isole Salomone"],["SO","Somalia"],
  ["ZA","Sudafrica"],["SS","Sudan del Sud"],["ES","Spagna"],["LK","Sri Lanka"],["SD","Sudan"],
  ["SR","Suriname"],["SE","Svezia"],["CH","Svizzera"],["SY","Siria"],["TW","Taiwan"],
  ["TJ","Tagikistan"],["TZ","Tanzania"],["TH","Tailandia"],["TL","Timor Est"],["TG","Togo"],
  ["TO","Tonga"],["TT","Trinidad e Tobago"],["TN","Tunisia"],["TR","Turchia"],["TM","Turkmenistan"],
  ["TV","Tuvalu"],["UG","Uganda"],["UA","Ucraina"],["AE","Emirati Arabi"],["GB","Regno Unito"],
  ["US","Stati Uniti"],["UY","Uruguay"],["UZ","Uzbekistan"],["VU","Vanuatu"],["VE","Venezuela"],
  ["VN","Vietnam"],["YE","Yemen"],["ZM","Zambia"],["ZW","Zimbabwe"],["XK","Kosovo"],
];
// Map for quick lookup
const PAESE_BY_CODE = Object.fromEntries(PAESI_ISO.map(([c,n])=>[c,n]));
const PAESE_BY_NAME = Object.fromEntries(PAESI_ISO.map(([c,n])=>[n.toLowerCase(),c]));


function validaPIVA(piva) {
  const p = (piva || "").replace(/\s/g, "");
  if (p.length !== 11) return { ok: false, msg: "Deve avere esattamente 11 cifre" };
  if (!/^\d{11}$/.test(p)) return { ok: false, msg: "Deve contenere solo numeri" };
  // Algoritmo di controllo P.IVA italiana (Luhn-like)
  let s = 0;
  for (let i = 0; i < 10; i++) {
    const n = parseInt(p[i]);
    s += i % 2 === 0 ? n : [0,2,4,6,8,1,3,5,7,9][n];
  }
  const check = (10 - (s % 10)) % 10;
  if (check !== parseInt(p[10])) return { ok: false, msg: "Cifra di controllo errata — verifica la P.IVA" };
  return { ok: true, msg: "✓ P.IVA valida" };
}

function validaCF(cf) {
  const c = (cf || "").replace(/\s/g, "").toUpperCase();
  if (c.length === 0) return { ok: false, msg: "Campo obbligatorio" };
  if (c.length !== 16) return { ok: false, msg: "Deve avere esattamente 16 caratteri" };
  if (!/^[A-Z0-9]{16}$/.test(c)) return { ok: false, msg: "Solo lettere maiuscole e numeri" };
  // Pattern base: LLLLLLDLDDLDDDDL (approssimativo ma efficace)
  if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(c))
    return { ok: false, msg: "Formato non valido (es. RSSMRA80A01H501Z)" };
  return { ok: true, msg: "✓ Codice Fiscale valido" };
}

function validaProvincia(p) {
  const s = (p || "").trim().toUpperCase();
  if (!s) return { ok: false, msg: "Obbligatoria" };
  if (s.length !== 2 || !/^[A-Z]{2}$/.test(s))
    return { ok: false, msg: "Deve essere la sigla a 2 lettere (es. RM, MI, LE)" };
  return { ok: true, msg: "✓" };
}

function validaCAP(cap) {
  const s = (cap || "").trim();
  if (!s) return { ok: null, msg: "" };
  if (!/^\d{5}$/.test(s)) return { ok: false, msg: "5 cifre (es. 00100)" };
  return { ok: true, msg: "✓" };
}

// ═══════════════════════════════════════════════════════════════
// NORMALIZZAZIONE DATE
// ═══════════════════════════════════════════════════════════════

// Converte QUALSIASI formato data in dd/mm/yyyy (per display)
function normalizeToDisplay(v) {
  if (!v) return "";
  if (v instanceof Date) {
    return `${String(v.getDate()).padStart(2,"0")}/${String(v.getMonth()+1).padStart(2,"0")}/${v.getFullYear()}`;
  }
  const s = String(v).trim();

  // Già dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  // yyyy-mm-dd o yyyy/mm/dd
  if (/^\d{4}[-\/]\d{2}[-\/]\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0,10).replace(/\//g,"-").split("-");
    return `${d}/${m}/${y}`;
  }

  // dd-mm-yyyy o dd-mm-yy
  if (/^\d{2}-\d{2}-\d{2,4}$/.test(s)) {
    const parts = s.split("-");
    const y = parts[2].length === 2 ? "20" + parts[2] : parts[2];
    return `${parts[0]}/${parts[1]}/${y}`;
  }

  // mm/dd/yyyy (formato US)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split("/");
    return `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}`;
  }

  // Numero seriale Excel (giorni dal 1/1/1900)
  if (/^\d{5}$/.test(s)) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + parseInt(s) * 86400000);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  }

  return s;
}

// Converte dd/mm/yyyy → yyyy-mm-dd (per XML)
function toXMLDate(s) {
  if (!s) return new Date().toISOString().slice(0, 10);
  const clean = normalizeToDisplay(s);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split("/");
    return `${y}-${m}-${d}`;
  }
  return clean.slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════
// PARSING FILE (Excel + CSV)
// ═══════════════════════════════════════════════════════════════

function parseImporto(s) {
  if (!s) return 0;
  const clean = String(s)
    .replace(/[^\d,\.]/g, "")
    .replace(/\.(?=.*\.)/g, "")
    .replace(",", ".");
  return parseFloat(clean) || 0;
}

function parseCSVText(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  // Rileva separatore (virgola o tab o punto e virgola)
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const parseRow = line => {
    const result = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === sep && !inQ) { result.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };
  const headers = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1)
    .filter(l => l.trim())
    .map(line => {
      const vals = parseRow(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || "").replace(/^"|"$/g, ""); });
      return obj;
    });
}

function parseAirbnbRows(rows) {
  const prenotazioni = [];
  const appartamentiMap = {};

  for (const row of rows) {
    const codice = row["Codice di conferma"] || row["Confirmation Code"] || row["confirmation_code"] || "";
    const stato  = row["Stato"] || row["Status"] || row["status"] || "";
    const ospite = row["Nome dell'ospite"] || row["Guest Name"] || row["Guest"] || row["guest_name"] || "";
    const checkinRaw  = row["Data di inizio"] || row["Start Date"] || row["Check-in"]  || row["checkin"]  || "";
    const checkoutRaw = row["Data di fine"]   || row["End Date"]   || row["Check-out"] || row["checkout"] || "";
    const notti  = parseInt(row["N. di notti"] || row["Nights"] || row["nights"] || 0) || 0;
    const annuncio = String(row["Annuncio"] || row["Listing"] || row["listing_name"] || "");
    const guadagni = row["Guadagni"] || row["Earnings"] || row["Payout"] || row["amount"] || "";
    const adulti = parseInt(row["N. di adulti"] || row["Adults"] || row["adults"] || 1) || 1;
    const bambini = parseInt(row["N. di bambini"] || row["Children"] || row["children"] || 0) || 0;

    if (!codice) continue;
    const statoLc = stato.toLowerCase();
    if (statoLc.includes("annull") || statoLc.includes("cancel")) continue;

    // Normalizza date
    const checkin  = normalizeToDisplay(checkinRaw);
    const checkout = normalizeToDisplay(checkoutRaw);

    // Estrai CIN dall'annuncio
    const cinMatch = annuncio.match(/cin[:\s]*([A-Za-z0-9]{10,})/i);
    const cin = cinMatch ? cinMatch[1] : "";
    const nomeApt = annuncio.replace(/\s*cin[:\s]*[A-Za-z0-9]+/i, "").trim() || annuncio;
    const importo = parseImporto(guadagni);

    if (!appartamentiMap[nomeApt]) {
      appartamentiMap[nomeApt] = {
        id: uid(), nome: nomeApt, cin,
        indirizzo: "", comune: "", provincia: "",
        foglio: "", particella: "", subalterno: "", rendita: "", quota: "100",
      };
    }

    prenotazioni.push({
      id: uid(), codice, ospite, adulti, bambini,
      checkin, checkout, notti,
      appartamentoId: appartamentiMap[nomeApt].id,
      appartamentoNome: nomeApt, importo,
      status: "draft",
    });
  }

  return { prenotazioni, appartamenti: Object.values(appartamentiMap) };
}

// ═══════════════════════════════════════════════════════════════
// XML TD01
// ═══════════════════════════════════════════════════════════════

// Rimuove caratteri non ASCII per evitare encoding garbled nel XML (es. ö → o)
function sanitizeXML(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // rimuove diacritici (é→e, ü→u, ñ→n…)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?")  // sostituisce caratteri non-ASCII con ?
    .replace(/[<>&"']/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"})[c]);
}

function generaXML(proprietario, appartamento, prenotazione, progressivo) {
  const imp       = fmtEur(prenotazione.importo);
  const checkinF  = toXMLDate(prenotazione.checkin);
  const checkoutF = toXMLDate(prenotazione.checkout);
  const prov      = (proprietario.provincia || "RM").slice(0, 2).toUpperCase();
  const email     = (proprietario.email || "").trim();
  const sistemaEmittente = (proprietario.sistemaEmittente || "").trim().slice(0, 10);

  // Data documento = oggi
  const dataDocumento = prenotazione.dataFattura
    ? prenotazione.dataFattura
    : `${oggi.getFullYear()}-${pad(oggi.getMonth()+1,2)}-${pad(oggi.getDate(),2)}`;

  // Numero fattura: anno + progressivo 5 cifre (es. TD01-202600001)
  const num = `TD01-${oggi.getFullYear()}${pad(progressivo, 5)}`;

  // Causale max 200 caratteri — aggiornata con N2.2
  const causaleBase = `Loc.breve - CIN:${appartamento.cin||"ND"} - CI:${checkinF} CO:${checkoutF} - Airbnb:${prenotazione.codice||""} - RgForf.L190/2014 - N2.2`;
  const causale = sanitizeXML(causaleBase.slice(0, 200));

  // CessionarioCommittente: CF italiano o estero
  const cfOspite = (prenotazione.cfOspite || "").trim();
  const isCFItaliano = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cfOspite.toUpperCase());
  // Per ospiti esteri: IdPaese = codice ISO reale (mai XX — SDI lo rifiuta con 00305)
  // IdCodice = 99999999999 (11 noni, valore fittizio non-zero accettato da SDI)
  const paeseOspite = (prenotazione.paeseOspite || "DE").trim().toUpperCase().slice(0,2);
  const cessionarioId = isCFItaliano
    ? `<CodiceFiscale>${cfOspite.toUpperCase()}</CodiceFiscale>`
    : `<IdFiscaleIVA><IdPaese>${paeseOspite}</IdPaese><IdCodice>99999999999</IdCodice></IdFiscaleIVA>`;
  const codDest = isCFItaliano ? "0000000" : "XXXXXXX";

  // Bollo virtuale: obbligatorio se importo > 77.47€
  // Per forfettari (RF19): DatiBollo nell'header basta — NON addebitare riga separata
  // (AdE risposta 67/2020 + FeX Id:477: riga N1 genera avviso per forfettari)
  const importoNum = parseFloat(prenotazione.importo) || 0;
  const haBollo = importoNum > 77.47;
  // ImportoTotaleDocumento = somma imponibili (solo imponibile locazione, bollo NON sommato)
  const totaleDocumento = imp;

  // Blocchi email opzionali (migliorano punteggio FeX senza rischio scarto)
  const emailTrasmittente = email
    ? `\n      <ContattiTrasmittente><Email>${sanitizeXML(email)}</Email></ContattiTrasmittente>`
    : "";
  const emailCedente = email
    ? `\n      <Contatti><Email>${sanitizeXML(email)}</Email></Contatti>`
    : "";

  // N2.2 = non soggette altri casi → CORRETTO per regime forfettario L.190/2014
  // N1   = escluse ex art.15 (rimborsi spese) → SBAGLIATO per forfettario
  const natura = "N2.2";
  const rifNorm = "Operazione non soggetta IVA art.1 cc.54-89 L.190/2014 - Regime Forfettario.";

  const sistemaEmittenteAttr = sistemaEmittente ? `\n  SistemaEmittente="${sistemaEmittente}"` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12"
  xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"${sistemaEmittenteAttr}>
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente><IdPaese>IT</IdPaese><IdCodice>${proprietario.cf}</IdCodice></IdTrasmittente>
      <ProgressivoInvio>${pad(progressivo, 5)}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>${codDest}</CodiceDestinatario>${emailTrasmittente}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${proprietario.piva}</IdCodice></IdFiscaleIVA>
        <CodiceFiscale>${proprietario.cf}</CodiceFiscale>
        <Anagrafica><Denominazione>${sanitizeXML(proprietario.nome)}</Denominazione></Anagrafica>
        <RegimeFiscale>${proprietario.regime || "RF19"}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${sanitizeXML(proprietario.indirizzo || "Via Sconosciuta 1")}</Indirizzo>
        <CAP>${proprietario.cap || "00000"}</CAP>
        <Comune>${sanitizeXML(proprietario.comune || "Roma")}</Comune>
        <Provincia>${prov}</Provincia>
        <Nazione>IT</Nazione>
      </Sede>${emailCedente}
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${cessionarioId}
        <Anagrafica><Denominazione>${sanitizeXML((prenotazione.ospite || "Ospite").slice(0, 80))}</Denominazione></Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>Via Sconosciuta 1</Indirizzo>
        <CAP>00000</CAP><Comune>${isCFItaliano ? "Italia" : "Estero"}</Comune><Nazione>${isCFItaliano ? "IT" : paeseOspite}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>${dataDocumento}</Data>
        <Numero>${num}</Numero>${haBollo ? `
        <DatiBollo><BolloVirtuale>SI</BolloVirtuale><ImportoBollo>2.00</ImportoBollo></DatiBollo>` : ""}
        <ImportoTotaleDocumento>${totaleDocumento}</ImportoTotaleDocumento>
        <Causale>${causale}</Causale>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <CodiceArticolo>
          <CodiceTipo>INTERNO</CodiceTipo>
          <CodiceValore>LOC-BREVE</CodiceValore>
        </CodiceArticolo>
        <Descrizione>Loc. breve ${sanitizeXML((appartamento.nome||"Appartamento").slice(0,50))} CI:${checkinF} CO:${checkoutF} (${prenotazione.notti}n)</Descrizione>
        <Quantita>${prenotazione.notti||1}.00</Quantita>
        <UnitaMisura>NOTTE</UnitaMisura>
        <PrezzoUnitario>${fmtEur(prenotazione.importo / (prenotazione.notti||1))}</PrezzoUnitario>
        <PrezzoTotale>${imp}</PrezzoTotale>
        <AliquotaIVA>0.00</AliquotaIVA>
        <Natura>${natura}</Natura>
        <AltriDatiGestionali>
          <TipoDato>AIRBNB</TipoDato>
          <RiferimentoTesto>${prenotazione.codice||""}</RiferimentoTesto>
        </AltriDatiGestionali>
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>0.00</AliquotaIVA>
        <Natura>${natura}</Natura>
        <ImponibileImporto>${imp}</ImponibileImporto>
        <Imposta>0.00</Imposta>
        <RiferimentoNormativo>${rifNorm}</RiferimentoNormativo>
      </DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>MP05</ModalitaPagamento>
        <ImportoPagamento>${imp}</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}


// ═══════════════════════════════════════════════════════════════
// XML TD17 — Integrazione/Autofattura acquisto servizi dall'estero
// Reverse charge commissioni Airbnb Ireland (art. 17 c.2 DPR 633/72)
// ═══════════════════════════════════════════════════════════════

function generaTD17XML(proprietario, mese, righe, progressivo, numFatturaAirbnb, lastDate, dataFattura) {
  // righe = [{ codice, commissione, data, viajero }]
  // Data documento = ultima data di pagamento del mese, mai nel futuro
  const oggiStr = new Date().toISOString().slice(0,10);
  const dataDoc = lastDate && lastDate <= oggiStr ? lastDate : oggiStr;
  const prov = (proprietario.provincia || "RM").slice(0,2).toUpperCase();
  const email = (proprietario.email || "").trim();
  const num = `TD17-${new Date().getFullYear()}${pad(progressivo, 5)}`;

  const totImponibile = righe.reduce((s, r) => s + r.commissione, 0);
  const totIVA = totImponibile * 0.22;
  const totDoc = fmtEur(totImponibile + totIVA);

  const emailTrasm = email ? `\n      <ContattiTrasmittente><Email>${sanitizeXML(email)}</Email></ContattiTrasmittente>` : "";
  const emailCed   = email ? `\n      <Contatti><Email>${sanitizeXML(email)}</Email></Contatti>` : "";

  // DatiFattureCollegate: usa dataFattura se fornita, altrimenti dataDoc (ultima data pagamento)
  const dataRif = dataFattura || dataDoc;
  const fattureCollegate = numFatturaAirbnb
    ? `
      <DatiFattureCollegate>
        <IdDocumento>${sanitizeXML(numFatturaAirbnb)}</IdDocumento>
        <Data>${dataRif}</Data>
      </DatiFattureCollegate>`
    : righe.map(r => `
      <DatiFattureCollegate>
        <IdDocumento>${sanitizeXML(r.codice)}</IdDocumento>
        <Data>${dataRif}</Data>
      </DatiFattureCollegate>`).join("");

  // DettaglioLinee: una riga per prenotazione
  const linee = righe.map((r, i) => `
      <DettaglioLinee>
        <NumeroLinea>${i + 1}</NumeroLinea>
        <Descrizione>Commissione Airbnb - ${sanitizeXML(r.codice)}${r.viajero ? " - " + sanitizeXML(r.viajero.slice(0,30)) : ""}</Descrizione>
        <Quantita>1.00</Quantita>
        <UnitaMisura>NR</UnitaMisura>
        <PrezzoUnitario>${fmtEur(r.commissione)}</PrezzoUnitario>
        <PrezzoTotale>${fmtEur(r.commissione)}</PrezzoTotale>
        <AliquotaIVA>22.00</AliquotaIVA>
      </DettaglioLinee>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12"
  xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente><IdPaese>IT</IdPaese><IdCodice>${sanitizeXML(proprietario.cf)}</IdCodice></IdTrasmittente>
      <ProgressivoInvio>${pad(progressivo, 5)}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>0000000</CodiceDestinatario>${emailTrasm}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IE</IdPaese><IdCodice>IE9827384L</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>Airbnb Ireland UC</Denominazione></Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>25 North Wall Quay</Indirizzo>
        <CAP>00000</CAP><Comune>Dublin 1</Comune><Nazione>IE</Nazione>
      </Sede>${emailCed}
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${sanitizeXML(proprietario.piva)}</IdCodice></IdFiscaleIVA>
        <CodiceFiscale>${sanitizeXML(proprietario.cf)}</CodiceFiscale>
        <Anagrafica><Denominazione>${sanitizeXML(proprietario.nome)}</Denominazione></Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${sanitizeXML(proprietario.indirizzo || "Via Sconosciuta 1")}</Indirizzo>
        <CAP>${proprietario.cap || "00000"}</CAP>
        <Comune>${sanitizeXML(proprietario.comune || "Roma")}</Comune>
        <Provincia>${prov}</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CessionarioCommittente>
    <SoggettoEmittente>CC</SoggettoEmittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD17</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>${dataDoc}</Data>
        <Numero>${num}</Numero>
        <ImportoTotaleDocumento>${totDoc}</ImportoTotaleDocumento>
        <Causale>Integrazione IVA commissioni Airbnb - Reverse charge art.17 c.2 DPR 633/72</Causale>
      </DatiGeneraliDocumento>${fattureCollegate}
    </DatiGenerali>
    <DatiBeniServizi>${linee}
      <DatiRiepilogo>
        <AliquotaIVA>22.00</AliquotaIVA>
        <ImponibileImporto>${fmtEur(totImponibile)}</ImponibileImporto>
        <Imposta>${fmtEur(totIVA)}</Imposta>
        <RiferimentoNormativo>Art. 17 comma 2 DPR 633/72 - Acquisto servizi intra-UE - Reverse charge</RiferimentoNormativo>
      </DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>MP05</ModalitaPagamento>
        <ImportoPagamento>${fmtEur(totImponibile)}</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════

const uid     = () => Math.random().toString(36).slice(2, 9);
const fmtEur  = n  => parseFloat(n || 0).toFixed(2);
const pad     = (n, l = 4) => String(n).padStart(l, "0");

// Nome file SDI: IT{PIVA}_{YYWWS}.xml  (5 car. obbligatori)
// YY=anno 2 cifre, WW=settimana ISO 2 cifre, S=sequenziale 0-9
function getISOWeek(d) {
  const date = new Date(d); date.setHours(0,0,0,0);
  date.setDate(date.getDate()+3-(date.getDay()+6)%7);
  const week1=new Date(date.getFullYear(),0,4);
  return 1+Math.round(((date-week1)/86400000-3+(week1.getDay()+6)%7)/7);
}
function nomeFileXML(piva, seq = 1) {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(2);
  const ww  = pad(getISOWeek(now), 2);
  const s   = Math.min(9, Math.max(0, seq));
  return `IT${piva}_${yy}${ww}${s}.xml`;
}

// Cartella di destinazione (File System Access API)
// Viene chiesta al primo download XML; poi riutilizzata per tutta la sessione.
let _dirHandle = null;

// Chiede all'utente di scegliere una cartella. Ritorna true se ok.
// Se il browser non supporta l'API, ritorna false silenziosamente.
async function ensureFolder() {
  if (_dirHandle) return true;              // già scelto
  if (!window.showDirectoryPicker) return false; // browser non supporta
  try {
    _dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    return true;
  } catch { return false; }                // utente ha annullato
}

async function scaricaBlob(content, filename, mime = "application/xml;charset=utf-8") {
  // Solo per XML prova a usare la cartella; per CSV usa sempre il download classico
  if (mime.includes("xml")) {
    const hasFolder = await ensureFolder();
    if (hasFolder && _dirHandle) {
      try {
        const fh = await _dirHandle.getFileHandle(filename, { create: true });
        const writable = await fh.createWritable();
        await writable.write(new Blob([content], { type: mime }));
        await writable.close();
        return;
      } catch (e) { console.warn("Scrittura cartella fallita, uso download classico", e); }
    }
  }
  // Fallback: download classico del browser
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const STORAGE_KEY = "gestionale_airbnb_v3";
function saveToStorage(p, r) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ proprietari: p, prenotazioni: r, savedAt: new Date().toISOString() })); } catch {}
}
function loadFromStorage() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════

const C = {
  bg:"#07090f", panel:"#111827", panel2:"#162032", border:"#1c2a3a",
  accent:"#0ea5e9", gold:"#eab308", green:"#22c55e", red:"#f43f5e",
  orange:"#f97316", purple:"#a78bfa", text:"#f0f4f8", muted:"#4a6080", input:"#0a0f1a",
};
const BASE = { fontFamily:"'JetBrains Mono','Courier New',monospace" };

// ── PaeseSelect ─────────────────────────────────────────────────
function PaeseSelect({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const displayValue = value
    ? `${value} — ${PAESE_BY_CODE[value] || "?"}`
    : "";

  const filtered = query.length < 1
    ? PAESI_ISO
    : PAESI_ISO.filter(([code, name]) =>
        name.toLowerCase().includes(query.toLowerCase()) ||
        code.toLowerCase().includes(query.toLowerCase())
      );

  const C2 = { bg:"#0a0f1a", border:"#1a2a3a", accent:"#00e5ff", text:"#f0f4f8",
               muted:"#4a6080", input:"#060d18", hover:"#0d1f33", it:"#22c55e" };

  return (
    <div ref={ref} style={{position:"relative"}}>
      <div
        onClick={()=>{ setOpen(o=>!o); if(!open) setQuery(""); }}
        style={{background:C2.input, border:`1px solid ${value ? C2.accent : C2.border}`,
          borderRadius:5, padding:"9px 12px", color: value ? C2.text : C2.muted,
          cursor:"pointer", fontSize:13, display:"flex", justifyContent:"space-between",
          alignItems:"center", userSelect:"none"}}>
        <span>{displayValue || "Seleziona paese…"}</span>
        <span style={{fontSize:9, color:C2.muted}}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{position:"absolute", zIndex:999, top:"100%", left:0, right:0,
          background:C2.bg, border:`1px solid ${C2.accent}40`, borderRadius:5,
          boxShadow:"0 8px 32px #000a", maxHeight:260, display:"flex", flexDirection:"column"}}>
          {/* Search input */}
          <div style={{padding:"8px 10px", borderBottom:`1px solid ${C2.border}`}}>
            <input
              autoFocus
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Cerca paese… (es. Germania, DE)"
              style={{width:"100%", background:"none", border:"none", outline:"none",
                color:C2.text, fontSize:12, padding:0}}
            />
          </div>
          {/* List */}
          <div style={{overflowY:"auto", flex:1}}>
            {filtered.length === 0
              ? <div style={{padding:"10px 12px", color:C2.muted, fontSize:11}}>Nessun risultato</div>
              : filtered.map(([code, name]) => (
                <div key={code}
                  onClick={()=>{ onChange(code); setOpen(false); setQuery(""); }}
                  style={{padding:"7px 12px", cursor:"pointer", fontSize:12,
                    display:"flex", gap:8, alignItems:"center",
                    background: value===code ? C2.accent+"20" : "transparent",
                    color: code==="IT" ? C2.it : C2.text}}
                  onMouseEnter={e=>e.currentTarget.style.background=C2.hover}
                  onMouseLeave={e=>e.currentTarget.style.background=value===code?C2.accent+"20":"transparent"}>
                  <span style={{fontWeight:700, minWidth:24, color:C2.accent, fontSize:11}}>{code}</span>
                  <span>{name}</span>
                  {code==="IT" && <span style={{marginLeft:"auto",fontSize:9,color:C2.it}}>🇮🇹 CF obbligatorio</span>}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

function Lbl({ children, color }) {
  return <div style={{ fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase", color:color||C.gold, marginBottom:4, fontWeight:700 }}>{children}</div>;
}

// Campo con validazione inline
function ValidatedInp({ value, onChange, placeholder, validator, type="text", transform }) {
  const v = validator ? validator(value) : null;
  const showV = value && value.length > 0;
  return (
    <div>
      <input type={type} value={value||""} placeholder={placeholder}
        onChange={e => onChange(transform ? transform(e.target.value) : e.target.value)}
        style={{
          ...BASE, width:"100%", boxSizing:"border-box",
          background: C.input,
          border: `1px solid ${showV ? (v?.ok ? C.green : C.red) : C.border}`,
          borderRadius:5, padding:"9px 12px", color:C.text, fontSize:13, outline:"none",
          transition:"border-color 0.2s",
        }}
      />
      {showV && v && (
        <div style={{ fontSize:10, color:v.ok ? C.green : C.red, marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
          {v.ok ? "✓" : "✗"} {v.msg}
        </div>
      )}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type="text" }) {
  return (
    <input type={type} value={value||""} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
      style={{ ...BASE, width:"100%", boxSizing:"border-box", background:C.input, border:`1px solid ${C.border}`, borderRadius:5, padding:"9px 12px", color:C.text, fontSize:13, outline:"none" }} />
  );
}

function Sel({ value, onChange, children }) {
  return (
    <select value={value||""} onChange={e=>onChange(e.target.value)}
      style={{ ...BASE, width:"100%", background:C.input, border:`1px solid ${C.border}`, borderRadius:5, padding:"9px 12px", color:C.text, fontSize:13, outline:"none" }}>
      {children}
    </select>
  );
}

function G({ cols=2, gap=10, children }) {
  return <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap, marginBottom:10 }}>{children}</div>;
}

function Tag({ color, children, small }) {
  return <span style={{ background:color+"20", color, border:`1px solid ${color}40`, borderRadius:4, padding:small?"1px 6px":"2px 8px", fontSize:small?9:10, fontWeight:700, whiteSpace:"nowrap" }}>{children}</span>;
}

function Btn({ onClick, disabled, color, outline, children, full, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...BASE, width:full?"100%":"auto", padding:small?"7px 14px":"11px 20px",
        border:outline?`1px solid ${color||C.border}`:"none", borderRadius:6,
        background:outline?"transparent":disabled?C.border:(color||C.accent),
        color:outline?(color||C.muted):disabled?C.muted:"#fff",
        fontSize:small?11:12, fontWeight:700, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1 }}>
      {children}
    </button>
  );
}

function SaveToast({ show }) {
  return show ? (
    <div style={{ position:"fixed", bottom:20, right:20, background:C.green+"ee", color:"#fff",
      padding:"10px 18px", borderRadius:8, fontSize:12, fontWeight:700, zIndex:1000, ...BASE }}>
      💾 Dati salvati
    </div>
  ) : null;
}

// ── DropZone (Excel + CSV) ────────────────────────────────────────────────────
function DropZone({ onParsed }) {
  const [dragging, setDragging] = useState(false);
  const [status,   setStatus]   = useState(null);
  const ref = useRef();

  async function processFile(file) {
    setStatus({ type:"loading", msg:"⏳ Lettura in corso..." });
    try {
      const name = file.name.toLowerCase();
      let rows = [];

      if (name.endsWith(".csv")) {
        // CSV — parsing nativo, nessuna dipendenza
        const text = await file.text();
        rows = parseCSVText(text);
      } else {
        // Excel — usa XLSX se disponibile (npm install xlsx)
        const XLSX = window.XLSX;
        if (!XLSX) throw new Error("Per i file .xlsx esegui: npm install xlsx e riavvia l'app.\nAlternativamente esporta come .csv da Airbnb.");
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab, { type:"array", cellDates:true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval:"" });
      }

      const result = parseAirbnbRows(rows);
      if (result.prenotazioni.length === 0) {
        setStatus({ type:"error", msg:"⚠ Nessuna prenotazione trovata. Controlla che sia un export Airbnb." });
        return;
      }
      setStatus({ type:"ok", msg:`✓ ${result.prenotazioni.length} prenotazioni importate da ${result.appartamenti.length} appartamenti` });
      onParsed(result);
    } catch(e) {
      setStatus({ type:"error", msg:"✗ " + e.message });
    }
  }

  return (
    <div>
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);if(e.dataTransfer.files[0])processFile(e.dataTransfer.files[0]);}}
        onClick={()=>ref.current.click()}
        style={{ border:`2px dashed ${dragging?C.accent:C.border}`, borderRadius:10, padding:"22px 16px",
          textAlign:"center", cursor:"pointer", background:dragging?C.accent+"08":C.input, transition:"all 0.2s" }}>
        <div style={{ fontSize:24, marginBottom:6 }}>📂</div>
        <div style={{ fontSize:13, color:C.text, fontWeight:700, marginBottom:3 }}>Trascina il file Airbnb qui</div>
        <div style={{ fontSize:11, color:C.muted }}>
          <span style={{ color:C.green, fontWeight:700 }}>.csv</span> (consigliato, funziona sempre) &nbsp;·&nbsp;
          <span style={{ color:C.gold, fontWeight:700 }}>.xlsx</span> (richiede npm install xlsx)
        </div>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}}
          onChange={e=>{if(e.target.files[0])processFile(e.target.files[0]);}} />
      </div>
      {status && (
        <div style={{ marginTop:8, padding:"9px 13px", borderRadius:6, fontSize:11, lineHeight:1.5,
          background:status.type==="ok"?C.green+"15":status.type==="error"?C.red+"15":C.accent+"15",
          color:status.type==="ok"?C.green:status.type==="error"?C.red:C.accent,
          border:`1px solid ${status.type==="ok"?C.green:status.type==="error"?C.red:C.accent}40`,
          whiteSpace:"pre-wrap" }}>
          {status.msg}
        </div>
      )}
    </div>
  );
}

// ── ApartmentCard ─────────────────────────────────────────────────────────────
function ApartmentCard({ apt, onChange, onDelete, prenotazioni, aptIndex }) {
  const [open, setOpen] = useState(false);
  const npren   = prenotazioni.filter(p=>p.appartamentoId===apt.id).length;
  const incasso = prenotazioni.filter(p=>p.appartamentoId===apt.id).reduce((s,p)=>s+p.importo,0);
  const completo = apt.indirizzo && apt.foglio && apt.rendita;

  return (
    <div style={{ border:`1px solid ${C.border}`, borderLeft:`3px solid ${open?C.gold:C.border}`, borderRadius:8, marginBottom:10, overflow:"hidden" }}>
      <div onClick={()=>setOpen(!open)} style={{ padding:"11px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", background:open?C.panel2:C.panel, gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{apt.nome||`Appartamento ${aptIndex+1}`}</div>
          <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{npren} pren. · €{incasso.toFixed(2)}{apt.cin?` · CIN: ${apt.cin.slice(0,14)}`:""}</div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          <Tag color={completo?C.green:apt.indirizzo?C.orange:C.red} small>{completo?"✓ OK":apt.indirizzo?"⚠ Parz.":"✗ Vuoto"}</Tag>
          <button onClick={e=>{e.stopPropagation();onDelete();}} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:16, padding:"0 4px", lineHeight:1 }}>✕</button>
          <span style={{ color:C.muted, fontSize:10 }}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:"14px", background:C.panel, borderTop:`1px solid ${C.border}` }}>
          {/* SDI */}
          <div style={{ background:"#0a1525", border:`1px solid ${C.accent}25`, borderRadius:7, padding:"12px", marginBottom:10 }}>
            <div style={{ fontSize:9, letterSpacing:"2px", color:C.accent, textTransform:"uppercase", fontWeight:700, marginBottom:9 }}>📄 Per la Fattura SDI</div>
            <div style={{marginBottom:9}}><Lbl color={C.accent}>Nome appartamento</Lbl><Inp value={apt.nome} onChange={v=>onChange("nome",v)} placeholder="Es. Trilocale Centro" /></div>
            <div style={{marginBottom:9}}><Lbl color={C.accent}>CIN</Lbl><Inp value={apt.cin} onChange={v=>onChange("cin",v)} placeholder="IT027034B4IZRRFKXJ" /></div>
            <div style={{marginBottom:9}}><Lbl color={C.accent}>Indirizzo completo *</Lbl><Inp value={apt.indirizzo} onChange={v=>onChange("indirizzo",v)} placeholder="Via Roma 5, int. 3" /></div>
            <G cols={2}>
              <div><Lbl color={C.accent}>Comune</Lbl><Inp value={apt.comune} onChange={v=>onChange("comune",v)} placeholder="Milano" /></div>
              <div>
                <Lbl color={C.accent}>Provincia (sigla 2 lettere)</Lbl>
                <ValidatedInp value={apt.provincia} onChange={v=>onChange("provincia",v)} placeholder="MI" validator={validaProvincia} transform={v=>v.toUpperCase().slice(0,2)} />
              </div>
            </G>
          </div>
          {/* Dichiarazione */}
          <div style={{ background:"#120a25", border:`1px solid ${C.purple}25`, borderRadius:7, padding:"12px" }}>
            <div style={{ fontSize:9, letterSpacing:"2px", color:C.purple, textTransform:"uppercase", fontWeight:700, marginBottom:9 }}>📊 Dichiarazione Redditi — Quadro RB</div>
            <G cols={3}>
              <div><Lbl color={C.purple}>Foglio</Lbl><Inp value={apt.foglio} onChange={v=>onChange("foglio",v)} placeholder="12" /></div>
              <div><Lbl color={C.purple}>Particella</Lbl><Inp value={apt.particella} onChange={v=>onChange("particella",v)} placeholder="345" /></div>
              <div><Lbl color={C.purple}>Subalterno</Lbl><Inp value={apt.subalterno} onChange={v=>onChange("subalterno",v)} placeholder="8" /></div>
            </G>
            <G cols={2}>
              <div><Lbl color={C.purple}>Rendita catastale (€)</Lbl><Inp value={apt.rendita} onChange={v=>onChange("rendita",v)} placeholder="450.00" type="number" /></div>
              <div><Lbl color={C.purple}>Quota possesso %</Lbl><Inp value={apt.quota} onChange={v=>onChange("quota",v)} placeholder="100" type="number" /></div>
            </G>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ProprietarioCard ──────────────────────────────────────────────────────────
function ProprietarioCard({ prop, onUpdate, onDelete, onAddApt, progressivoStart, allPrenotazioni, onDeleteApt, onDeletePrenotazioni, onAddPrenotazione, onUpdatePrenotazione }) {
  const [open,       setOpen]       = useState(true);
  const [tab,        setTab]        = useState("dati");
  const [showImport, setShowImport] = useState(false);
  const [selected,   setSelected]   = useState(new Set());
  const [editingId,  setEditingId]  = useState(null);
  const [editDraft,  setEditDraft]  = useState(null);
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo,   setFilterDateTo]   = useState("");

  const set    = (k,v) => onUpdate({...prop,[k]:v});
  const setApt = (i,k,v) => { const apts=prop.appartamenti.map((a,j)=>j===i?{...a,[k]:v}:a); onUpdate({...prop,appartamenti:apts}); };

  const myPren     = allPrenotazioni.filter(p=>p.proprietarioId===prop.id);

  // Filtro per la visualizzazione (non tocca la selezione)
  const filteredPren = myPren.filter(p => {
    if (filterStatus !== "all" && (p.status||"draft") !== filterStatus) return false;
    if (filterDateFrom) {
      const cin = toXMLDate(p.checkin); // yyyy-mm-dd
      if (cin < filterDateFrom) return false;
    }
    if (filterDateTo) {
      const cin = toXMLDate(p.checkin);
      if (cin > filterDateTo) return false;
    }
    return true;
  });
  const totIncasso = myPren.reduce((s,p)=>s+p.importo,0);

  // Prenotazioni orfane = appartamentoId non corrisponde a nessun appartamento attuale
  const aptIds   = new Set(prop.appartamenti.map(a=>a.id));
  const orfane   = myPren.filter(p=>!aptIds.has(p.appartamentoId));
  const orfaneIds = new Set(orfane.map(p=>p.id));

  const pivaV  = validaPIVA(prop.piva);
  const cfV    = validaCF(prop.cf);
  const provV  = validaProvincia(prop.provincia);
  const datiOk = pivaV.ok && cfV.ok;

  function onImportParsed(result) {
    const existingNames = new Set(prop.appartamenti.map(a=>a.nome));
    const newApts = result.appartamenti.filter(a=>!existingNames.has(a.nome));
    const updatedApts = [...prop.appartamenti, ...newApts];
    const aptByName = {};
    updatedApts.forEach(a=>{ aptByName[a.nome]=a.id; });
    const newPren = result.prenotazioni.map(p=>({
      ...p, proprietarioId:prop.id,
      appartamentoId: aptByName[p.appartamentoNome] || uid(),
    }));
    onUpdate({...prop, appartamenti:updatedApts, _newPren:newPren});
    setShowImport(false);
  }

  function toggleAll() {
    if (selected.size === myPren.length) setSelected(new Set());
    else setSelected(new Set(myPren.map(p=>p.id)));
  }

  function toggleOne(id) {
    setSelected(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  function selectOrfane() {
    setSelected(new Set(orfane.map(p=>p.id)));
  }

  function eliminaSelezionate() {
    if (selected.size===0) return;
    if (!window.confirm(`Eliminare ${selected.size} prenotazione/i selezionate?`)) return;
    onDeletePrenotazioni([...selected]);
    setSelected(new Set());
  }

  async function scaricaSelezionate() {
    if (!datiOk) { alert("⚠ Correggi P.IVA e Codice Fiscale prima di generare le fatture!"); return; }
    const toDownload = myPren.filter(p=>selected.has(p.id) && (p.status||"draft")==="ready");
    const notReady   = myPren.filter(p=>selected.has(p.id) && (p.status||"draft")!=="ready");
    const itaSenzaCF = toDownload.filter(p => (p.paeseOspite||"").toUpperCase()==="IT" && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test((p.cfOspite||"").trim().toUpperCase()));
    if (itaSenzaCF.length > 0) {
      alert(`⚠ ${itaSenzaCF.length} prenotazione/i con ospite italiano senza CF valido:\n${itaSenzaCF.map(p=>`• ${p.ospite} (${p.checkin})`).join("\n")}\n\nModifica le prenotazioni prima di generare l'XML.`);
      return;
    }
    if (notReady.length>0) { alert(`ℹ ${notReady.length} prenotazione/i ignorate perché non in stato "Pronta".`); }
    if (toDownload.length===0) return;
    let prog = progressivoStart;
    for (let i=0;i<toDownload.length;i++) {
      const pren=toDownload[i];
      const apt=prop.appartamenti.find(a=>a.id===pren.appartamentoId)||{nome:"App",cin:"",indirizzo:""};
      const xml=generaXML(prop,apt,pren,prog);
      const fname=nomeFileXML(prop.piva, i+1);
      await new Promise(r=>setTimeout(()=>{scaricaBlob(xml,fname);r();},i*200));
      prog++;
    }
  }

  async function scaricaTutti() {
    if (!datiOk) { alert("⚠ Correggi P.IVA e Codice Fiscale prima di generare le fatture!"); return; }
    const toDownload = myPren.filter(p=>(p.status||"draft")==="ready");
    if (toDownload.length===0) { alert(`⚠ Nessuna prenotazione è in stato "Pronta". Cambia lo status prima di generare l'XML.`); return; }
    const itaSenzaCF2 = toDownload.filter(p => (p.paeseOspite||"").toUpperCase()==="IT" && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test((p.cfOspite||"").trim().toUpperCase()));
    if (itaSenzaCF2.length > 0) {
      alert(`⚠ ${itaSenzaCF2.length} prenotazione/i con ospite italiano senza CF valido:\n${itaSenzaCF2.map(p=>`• ${p.ospite} (${p.checkin})`).join("\n")}\n\nModifica le prenotazioni prima di generare l'XML.`);
      return;
    }
    let prog=progressivoStart;
    for (let i=0;i<toDownload.length;i++) {
      const pren=toDownload[i];
      const apt=prop.appartamenti.find(a=>a.id===pren.appartamentoId)||{nome:"App",cin:"",indirizzo:""};
      const xml=generaXML(prop,apt,pren,prog);
      const fname=nomeFileXML(prop.piva, i+1);
      await new Promise(r=>setTimeout(()=>{scaricaBlob(xml,fname);r();},i*200));
      prog++;
    }
  }

  // ── Modifica prenotazione ─────────────────────────────────
  function startEdit(p) {
    setEditingId(p.id);
    setEditDraft({...p});
  }
  function cancelEdit() { setEditingId(null); setEditDraft(null); }
  function saveEdit() {
    if (!editDraft) return;
    const paese = (editDraft.paeseOspite||"").trim();
    const cf = (editDraft.cfOspite||"").trim();
    const status = editDraft.status||"draft";

    // Blocca "Pronta" senza paese
    if (status === "ready" && !paese) {
      alert("⚠ Seleziona la nazionalità dell'ospite prima di impostare la prenotazione come \"Pronta\".");
      return;
    }
    // Blocca "Pronta" se italiano senza CF valido
    if (status === "ready" && paese === "IT") {
      if (!cf) { alert("⚠ L'ospite è italiano — il Codice Fiscale è obbligatorio."); return; }
      if (cf.length !== 16) { alert(`⚠ Il Codice Fiscale deve essere di 16 caratteri (attuale: ${cf.length}).`); return; }
      if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf)) { alert("⚠ Il Codice Fiscale non è nel formato corretto."); return; }
    }
    // Blocca salvataggio (qualunque status) se italiano con CF invalido
    if (paese === "IT" && cf && cf.length !== 16) {
      alert(`⚠ Il Codice Fiscale deve essere di 16 caratteri (attuale: ${cf.length}).`); return;
    }
    // Ricalcola notti se date cambiate
    let draft = {...editDraft};
    try {
      const ci = toXMLDate(draft.checkin);
      const co = toXMLDate(draft.checkout);
      if (ci && co) {
        const diff = (new Date(co) - new Date(ci)) / 86400000;
        if (diff > 0) draft.notti = diff;
      }
    } catch {}
    onDeletePrenotazioni([draft.id]);
    onAddPrenotazione({...draft});
    setEditingId(null);
    setEditDraft(null);
  }

  // ── Export CSV ──────────────────────────────────────────────
  function esportaCSV() {
    const headers = ["Codice","Ospite","Appartamento","CIN","Check-in","Check-out","Notti","Importo (EUR)"];
    const rows = myPren.map(p => {
      const apt = prop.appartamenti.find(a=>a.id===p.appartamentoId);
      return [
        p.codice, p.ospite,
        apt?.nome || p.appartamentoNome || "",
        apt?.cin || "",
        p.checkin, p.checkout, p.notti,
        p.importo.toFixed(2),
      ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    scaricaBlob(csv, `prenotazioni_${prop.nome||"proprietario"}_${new Date().toISOString().slice(0,10)}.csv`, "text/csv;charset=utf-8");
  }

  const TABS = [
    {id:"dati",          label:"📋 Dati personali"},
    {id:"appartamenti",  label:`🏠 App. (${prop.appartamenti.length})`},
    {id:"prenotazioni",  label:`📅 Pren. (${myPren.length})`, badge: orfane.length>0?orfane.length:null},
    {id:"dichiarazione", label:"📊 Dichiarazione"},
  ];

  return (
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,marginBottom:20,overflow:"hidden"}}>

      {/* ── Header ── */}
      <div style={{background:"linear-gradient(135deg,#0f1f35,#162032)",padding:"13px 17px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div onClick={()=>setOpen(!open)} style={{cursor:"pointer",flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:14,fontWeight:800,color:C.accent}}>👤 {prop.nome||"Nuovo proprietario"}</span>
            <Tag color={datiOk?C.green:C.orange}>{datiOk?"✓ Dati validi":prop.piva?"⚠ Verifica dati":"P.IVA mancante"}</Tag>
            {orfane.length>0 && <Tag color={C.red}>⚠ {orfane.length} orfane</Tag>}
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:2}}>{prop.appartamenti.length} app. · {myPren.length} pren. · <span style={{color:C.green}}>€{totIncasso.toFixed(2)}</span></div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={()=>setShowImport(s=>!s)} style={{...BASE,background:showImport?"#1a2b10":"transparent",border:`1px solid ${C.gold}40`,color:C.gold,padding:"6px 10px",borderRadius:5,fontSize:10,cursor:"pointer",fontWeight:700}}>📂 Importa</button>
          {myPren.length>0 && <>
            <Btn onClick={scaricaTutti} color={datiOk?C.green:C.orange} small>⬇ Singoli</Btn>
          </>}
          <Btn onClick={onDelete} color={C.red} outline small>✕</Btn>
          <span onClick={()=>setOpen(!open)} style={{color:C.muted,cursor:"pointer",fontSize:11}}>{open?"▲":"▼"}</span>
        </div>
      </div>

      {/* ── Import zone ── */}
      {showImport && (
        <div style={{padding:"14px 17px",background:"#0d1a0a",borderBottom:`1px solid ${C.gold}30`}}>
          <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:10}}>
            Importa prenotazioni per: <span style={{color:C.text}}>{prop.nome||"questo proprietario"}</span>
          </div>
          <DropZone onParsed={onImportParsed} />
        </div>
      )}

      {open && (
        <div>
          {/* ── Tabs ── */}
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setSelected(new Set());}}
                style={{...BASE,padding:"9px 14px",border:"none",background:"none",
                  color:tab===t.id?C.accent:C.muted,
                  borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",
                  fontSize:10,fontWeight:700,letterSpacing:"0.5px",cursor:"pointer",whiteSpace:"nowrap",
                  display:"flex",alignItems:"center",gap:5}}>
                {t.label}
                {t.badge && <span style={{background:C.red,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:800}}>{t.badge}</span>}
              </button>
            ))}
          </div>

          <div style={{padding:"16px 17px"}}>

            {/* ── DATI PERSONALI ── */}
            {tab==="dati" && (
              <div>
                <div style={{marginBottom:10}}><Lbl>Nome / Denominazione *</Lbl><Inp value={prop.nome} onChange={v=>set("nome",v)} placeholder="Mario Rossi" /></div>
                <G cols={2}>
                  <div><Lbl>Partita IVA * (11 cifre)</Lbl><ValidatedInp value={prop.piva} onChange={v=>set("piva",v)} placeholder="12345678901" validator={validaPIVA} transform={v=>v.replace(/\D/g,"").slice(0,11)} /></div>
                  <div><Lbl>Codice Fiscale * (16 caratteri)</Lbl><ValidatedInp value={prop.cf} onChange={v=>set("cf",v)} placeholder="RSSMRA80A01H501Z" validator={validaCF} transform={v=>v.toUpperCase().slice(0,16)} /></div>
                </G>
                <div style={{marginBottom:10}}><Lbl>Indirizzo</Lbl><Inp value={prop.indirizzo} onChange={v=>set("indirizzo",v)} placeholder="Via Garibaldi 1" /></div>
                <G cols={3}>
                  <div><Lbl>CAP</Lbl><ValidatedInp value={prop.cap} onChange={v=>set("cap",v)} placeholder="00100" validator={validaCAP} transform={v=>v.replace(/\D/g,"").slice(0,5)} /></div>
                  <div><Lbl>Comune</Lbl><Inp value={prop.comune} onChange={v=>set("comune",v)} placeholder="Roma" /></div>
                  <div><Lbl>Provincia (sigla)</Lbl><ValidatedInp value={prop.provincia} onChange={v=>set("provincia",v)} placeholder="RM" validator={validaProvincia} transform={v=>v.toUpperCase().slice(0,2)} /></div>
                </G>
                <div><Lbl>Regime fiscale</Lbl>
                  <Sel value={prop.regime} onChange={v=>set("regime",v)}>
                    <option value="RF19">RF19 — Forfettario</option>
                    <option value="RF01">RF01 — Ordinario</option>
                  </Sel>
                </div>
                <div style={{marginTop:10}}>
                  <Lbl color={C.accent}>Email (per XML SDI — ContattiTrasmittente)</Lbl>
                  <Inp value={prop.email||""} onChange={v=>set("email",v)} placeholder="mario.rossi@email.it" type="email" />
                  <div style={{fontSize:10,color:C.muted,marginTop:3}}>📬 Migliora il punteggio qualità FeX · Facoltativa</div>
                </div>
                <div style={{marginTop:10}}>
                  <Lbl color={C.accent}>Sistema Emittente (attributo XML — max 10 caratteri)</Lbl>
                  <Inp value={prop.sistemaEmittente||""} onChange={v=>set("sistemaEmittente",v.slice(0,10))} placeholder="es. MioSoftware" />
                  <div style={{fontSize:10,color:C.muted,marginTop:3}}>⚙️ Default: P.IVA del proprietario · Facoltativo · Max 10 caratteri</div>
                </div>
                <div style={{marginTop:14,background:datiOk?"#0a1f0a":C.panel2,border:`1px solid ${datiOk?C.green:C.orange}40`,borderRadius:8,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:datiOk?C.green:C.orange,fontWeight:700,marginBottom:8}}>
                    {datiOk?"✅ Dati validi — XML pronto per SDI":"⚠ Correggi i dati prima di generare i file XML"}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {[["P.IVA",pivaV],["Codice Fiscale",cfV],["Provincia",provV],["CAP",validaCAP(prop.cap)]].map(([l,r])=>r&&r.msg?(
                      <div key={l} style={{fontSize:10,color:r.ok?C.green:r.ok===false?C.red:C.muted}}>
                        {r.ok?"✓":r.ok===false?"✗":"·"} {l}: {r.msg}
                      </div>
                    ):null)}
                  </div>
                </div>
              </div>
            )}

            {/* ── APPARTAMENTI ── */}
            {tab==="appartamenti" && (
              <div>
                {prop.appartamenti.length===0?(
                  <div style={{textAlign:"center",padding:"24px",color:C.muted,fontSize:13}}>Nessun appartamento. Aggiungine uno o importa un file.</div>
                ):prop.appartamenti.map((apt,i)=>(
                  <ApartmentCard key={apt.id} apt={apt} aptIndex={i}
                    onChange={(k,v)=>setApt(i,k,v)}
                    onDelete={()=>onDeleteApt(apt.id)}
                    prenotazioni={myPren} />
                ))}
                <Btn onClick={onAddApt} color={C.gold} outline full>+ Aggiungi appartamento</Btn>
              </div>
            )}

            {/* ── PRENOTAZIONI ── */}
            {tab==="prenotazioni" && (
              <div>
                {/* ── Modal modifica ── */}
                {editingId && editDraft && (
                  <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                    <div style={{background:C.panel,border:`1px solid ${C.accent}`,borderRadius:12,padding:"22px 24px",width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}>
                      <div style={{fontSize:12,fontWeight:800,color:C.accent,marginBottom:16}}>✏️ Modifica prenotazione</div>

                      <div style={{marginBottom:10}}><Lbl>Codice Airbnb</Lbl>
                        <Inp value={editDraft.codice} onChange={v=>setEditDraft(d=>({...d,codice:v}))} placeholder="HMW2CDMYXR" />
                      </div>

                      {/* Nazionalità ospite — campo pivot */}
                      <div style={{marginBottom:10}}>
                        <Lbl>Nazionalità ospite <span style={{color:C.muted,fontWeight:400,fontSize:9}}>obbligatoria per generare XML</span></Lbl>
                        <PaeseSelect
                          value={editDraft.paeseOspite||""}
                          onChange={v=>setEditDraft(d=>({...d, paeseOspite:v, cfOspite: v!=="IT" ? "" : d.cfOspite}))}
                        />
                        {!(editDraft.paeseOspite||"").trim() && (
                          <div style={{fontSize:10,color:C.red,marginTop:3}}>⚠ Seleziona la nazionalità prima di impostare "Pronta"</div>
                        )}
                      </div>

                      {/* CF solo se italiano */}
                      {(editDraft.paeseOspite||"").toUpperCase()==="IT" && (
                        <div style={{marginBottom:10}}>
                          <Lbl color={C.accent}>Codice Fiscale ospite <span style={{color:C.red,fontSize:11}}>*</span></Lbl>
                          <Inp
                            value={editDraft.cfOspite||""}
                            onChange={v=>setEditDraft(d=>({...d,cfOspite:v.toUpperCase().slice(0,16)}))}
                            placeholder="RSSMRA80A01H501Z"
                            style={{border:`1px solid ${editDraft.cfOspite && editDraft.cfOspite.length===16 ? C.green : C.red}50`}}
                          />
                          {editDraft.cfOspite && editDraft.cfOspite.length!==16 && (
                            <div style={{fontSize:10,color:C.red,marginTop:3}}>⚠ Il CF deve essere di 16 caratteri ({editDraft.cfOspite.length}/16)</div>
                          )}
                          {editDraft.cfOspite && editDraft.cfOspite.length===16 && (
                            <div style={{fontSize:10,color:C.green,marginTop:3}}>✓ Formato corretto</div>
                          )}
                        </div>
                      )}
                      <div style={{marginBottom:10}}><Lbl>Nome ospite</Lbl>
                        <Inp value={editDraft.ospite} onChange={v=>setEditDraft(d=>({...d,ospite:v}))} placeholder="Mario Rossi" />
                      </div>
                      <div style={{marginBottom:10}}>
                        <Lbl>Appartamento</Lbl>
                        <select value={editDraft.appartamentoId} onChange={e=>{
                          const apt=prop.appartamenti.find(a=>a.id===e.target.value);
                          setEditDraft(d=>({...d,appartamentoId:e.target.value,appartamentoNome:apt?.nome||d.appartamentoNome}));
                        }} style={{...BASE,width:"100%",background:C.input,border:`1px solid ${C.border}`,borderRadius:5,padding:"9px 12px",color:C.text,fontSize:13,outline:"none"}}>
                          <option value="">— Seleziona appartamento —</option>
                          {prop.appartamenti.map(a=>(
                            <option key={a.id} value={a.id}>{a.nome}</option>
                          ))}
                        </select>
                      </div>
                      {/* Data fattura */}
                      <div style={{marginBottom:10}}>
                        <Lbl>Data fattura <span style={{color:C.muted,fontWeight:400,fontSize:9}}>default: giorno di generazione XML</span></Lbl>
                        <input
                          type="date"
                          value={editDraft.dataFattura||""}
                          onChange={e=>setEditDraft(d=>({...d,dataFattura:e.target.value}))}
                          style={{...BASE,width:"100%",background:C.input,border:`1px solid ${editDraft.dataFattura?C.accent:C.border}`,
                            borderRadius:5,padding:"9px 12px",color:editDraft.dataFattura?C.text:C.muted,fontSize:13,outline:"none",cursor:"pointer",boxSizing:"border-box"}}
                        />
                        {editDraft.dataFattura && (
                          <button onClick={()=>setEditDraft(d=>({...d,dataFattura:""}))}
                            style={{background:"none",border:"none",color:C.muted,fontSize:10,cursor:"pointer",marginTop:3,padding:0}}>
                            ✕ Rimuovi (usa data generazione)
                          </button>
                        )}
                      </div>
                      <G cols={2}>
                        <div><Lbl>Check-in (gg/mm/aaaa)</Lbl>
                          <Inp value={editDraft.checkin} onChange={v=>setEditDraft(d=>({...d,checkin:v}))} placeholder="14/05/2026" />
                        </div>
                        <div><Lbl>Check-out (gg/mm/aaaa)</Lbl>
                          <Inp value={editDraft.checkout} onChange={v=>setEditDraft(d=>({...d,checkout:v}))} placeholder="17/05/2026" />
                        </div>
                      </G>
                      <G cols={2}>
                        <div><Lbl>Notti</Lbl>
                          <Inp value={editDraft.notti} onChange={v=>setEditDraft(d=>({...d,notti:parseInt(v)||0}))} placeholder="3" type="number" />
                        </div>
                        <div><Lbl>Importo (€)</Lbl>
                          <Inp value={editDraft.importo} onChange={v=>setEditDraft(d=>({...d,importo:parseFloat(v)||0}))} placeholder="350.00" type="number" />
                        </div>
                      </G>
                      <G cols={2}>
                        <div><Lbl>Adulti</Lbl>
                          <Inp value={editDraft.adulti} onChange={v=>setEditDraft(d=>({...d,adulti:parseInt(v)||0}))} placeholder="2" type="number" />
                        </div>
                        <div><Lbl>Bambini</Lbl>
                          <Inp value={editDraft.bambini} onChange={v=>setEditDraft(d=>({...d,bambini:parseInt(v)||0}))} placeholder="0" type="number" />
                        </div>
                      </G>

                      <div style={{marginBottom:10}}>
                        <Lbl>Stato fattura</Lbl>
                        <select value={editDraft.status||"draft"} onChange={e=>setEditDraft(d=>({...d,status:e.target.value}))}
                          style={{...BASE,width:"100%",background:C.input,border:`1px solid ${STATUSES[editDraft.status||"draft"]?.color||C.border}`,borderRadius:5,padding:"9px 12px",color:STATUSES[editDraft.status||"draft"]?.color||C.text,fontSize:13,outline:"none",fontWeight:700}}>
                          {STATUS_KEYS.map(k=>(
                            <option key={k} value={k}>{STATUSES[k].emoji} {STATUSES[k].label}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{display:"flex",gap:10,marginTop:18}}>
                        <button onClick={cancelEdit} style={{...BASE,flex:1,padding:"11px",border:`1px solid ${C.border}`,borderRadius:6,background:"none",color:C.muted,fontSize:12,cursor:"pointer"}}>Annulla</button>
                        <button onClick={saveEdit}
                          style={{...BASE,flex:2,padding:"11px",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,
                            background: (editDraft.status||"draft")==="ready" && !(editDraft.paeseOspite||"").trim() ? C.orange : C.accent,
                            color:"#fff"}}>
                          {(editDraft.status||"draft")==="ready" && !(editDraft.paeseOspite||"").trim()
                            ? "⚠ Imposta nazionalità prima"
                            : "💾 Salva modifiche"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {myPren.length===0 ? (
                  <div style={{textAlign:"center",padding:"24px",color:C.muted,fontSize:13}}>Importa un file CSV o Excel da Airbnb.</div>
                ) : (
                  <div>
                    {/* Avviso orfane */}
                    {orfane.length>0 && (
                      <div style={{background:C.red+"12",border:`1px solid ${C.red}40`,borderRadius:8,padding:"11px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                        <div>
                          <div style={{fontSize:11,color:C.red,fontWeight:700}}>⚠ {orfane.length} prenotazione/i orfane</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:2}}>Appartamento eliminato — queste prenotazioni non genereranno un XML corretto</div>
                        </div>
                        <button onClick={selectOrfane}
                          style={{...BASE,background:C.red+"20",border:`1px solid ${C.red}50`,color:C.red,padding:"6px 12px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer"}}>
                          Seleziona orfane
                        </button>
                      </div>
                    )}

                    {/* Filtri */}
                    <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center",background:C.panel2,borderRadius:7,padding:"9px 12px",border:`1px solid ${C.border}`}}>
                      <span style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:"1px"}}>FILTRI</span>
                      {/* Status */}
                      <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                        style={{...BASE,background:C.input,border:`1px solid ${filterStatus!=="all"?C.accent:C.border}`,borderRadius:5,padding:"5px 8px",color:filterStatus!=="all"?C.accent:C.muted,fontSize:11,outline:"none",cursor:"pointer"}}>
                        <option value="all">Tutti gli status</option>
                        {STATUS_KEYS.map(k=>(
                          <option key={k} value={k}>{STATUSES[k].emoji} {STATUSES[k].label}</option>
                        ))}
                      </select>
                      {/* Date check-in */}
                      <span style={{fontSize:10,color:C.muted}}>Check-in:</span>
                      <input type="date" value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)}
                        style={{...BASE,background:C.input,border:`1px solid ${filterDateFrom?C.accent:C.border}`,borderRadius:5,padding:"5px 8px",color:C.text,fontSize:11,outline:"none",cursor:"pointer"}} />
                      <span style={{fontSize:10,color:C.muted}}>→</span>
                      <input type="date" value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)}
                        style={{...BASE,background:C.input,border:`1px solid ${filterDateTo?C.accent:C.border}`,borderRadius:5,padding:"5px 8px",color:C.text,fontSize:11,outline:"none",cursor:"pointer"}} />
                      {(filterStatus!=="all"||filterDateFrom||filterDateTo) && (
                        <button onClick={()=>{setFilterStatus("all");setFilterDateFrom("");setFilterDateTo("");}}
                          style={{...BASE,background:"none",border:`1px solid ${C.red}50`,color:C.red,padding:"5px 9px",borderRadius:5,fontSize:10,cursor:"pointer",marginLeft:"auto"}}>
                          ✕ Reset
                        </button>
                      )}
                      <span style={{fontSize:10,color:C.muted,marginLeft:"auto"}}>{filteredPren.length}/{myPren.length}</span>
                    </div>

                    {/* Toolbar */}
                    <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                      <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:C.muted}}>
                        <input type="checkbox"
                          checked={selected.size===myPren.length && myPren.length>0}
                          ref={el=>{if(el) el.indeterminate=selected.size>0&&selected.size<myPren.length;}}
                          onChange={toggleAll}
                          style={{width:14,height:14,cursor:"pointer",accentColor:C.accent}}
                        />
                        {selected.size>0 ? `${selected.size} selezionate` : "Seleziona tutto"}
                      </label>

                      <div style={{display:"flex",gap:6,marginLeft:"auto",flexWrap:"wrap"}}>
                        {/* CSV export sempre visibile */}
                        <button onClick={esportaCSV}
                          style={{...BASE,background:"transparent",border:`1px solid ${C.gold}50`,color:C.gold,padding:"6px 12px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer"}}>
                          ⬇ CSV
                        </button>
                        {selected.size>0 && <>
                          {/* Cambio status multiplo */}
                          <select
                            onChange={e=>{
                              const newStatus = e.target.value;
                              if (!newStatus) return;
                              if (newStatus === "ready") {
                                const senzaPaese = [...selected].filter(id => {
                                  const p = myPren.find(x=>x.id===id);
                                  return p && !(p.paeseOspite||"").trim();
                                });
                                if (senzaPaese.length > 0) {
                                  alert(`⚠ ${senzaPaese.length} prenotazione/i senza nazionalità impostata.\nImposta la nazionalità nel modal ✏️ prima di impostare "Pronta".`);
                                  e.target.value="";
                                  return;
                                }
                              }
                              [...selected].forEach(id=>{
                                const p = myPren.find(x=>x.id===id);
                                if (p) onUpdatePrenotazione({...p, status:newStatus});
                              });
                              e.target.value="";
                            }}
                            defaultValue=""
                            style={{...BASE,background:C.panel2,border:`1px solid ${C.accent}50`,borderRadius:5,padding:"6px 10px",color:C.accent,fontSize:10,fontWeight:700,cursor:"pointer",outline:"none"}}>
                            <option value="" disabled>🏷 Status ({selected.size})</option>
                            {STATUS_KEYS.map(k=>(
                              <option key={k} value={k}>{STATUSES[k].emoji} {STATUSES[k].label}</option>
                            ))}
                          </select>
                          <button onClick={scaricaSelezionate}
                            style={{...BASE,background:C.green,border:"none",color:"#fff",padding:"6px 13px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer"}}
                            title="Solo le prenotazioni in stato Pronta">
                            ⬇ XML ({myPren.filter(p=>selected.has(p.id)&&(p.status||"draft")==="ready").length}/{selected.size})
                          </button>
                          <button onClick={eliminaSelezionate}
                            style={{...BASE,background:C.red+"20",border:`1px solid ${C.red}50`,color:C.red,padding:"6px 13px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer"}}>
                            🗑 Elimina ({selected.size})
                          </button>
                        </>}
                      </div>
                    </div>

                    {/* Tabella */}
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                        <thead>
                          <tr style={{background:C.panel2}}>
                            <th style={{padding:"7px 8px",width:28}}/>
                            {["#","Codice","Ospite","Appartamento","Check-in","Check-out","Notti","€","🔖","Stato","",""].map((h,i)=>(
                              <th key={i} style={{padding:"7px 8px",textAlign:"left",color:C.gold,fontSize:9,letterSpacing:"1px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPren.map((p,i)=>{
                            const isOrfana  = orfaneIds.has(p.id);
                            const isSel     = selected.has(p.id);
                            const isEditing = editingId === p.id;
                            const aptNome   = prop.appartamenti.find(a=>a.id===p.appartamentoId)?.nome||null;
                            const st        = STATUSES[p.status||"ready"] || STATUSES.ready;
                            const isItaSenzaCF = (p.paeseOspite||"").toUpperCase()==="IT" && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test((p.cfOspite||"").trim().toUpperCase());
                            return (
                              <tr key={p.id} onClick={()=>!editingId&&toggleOne(p.id)}
                                style={{borderBottom:`1px solid ${C.border}`,cursor:"pointer",transition:"background 0.1s",
                                  background:isEditing?C.gold+"15":isSel?C.accent+"18":isItaSenzaCF?C.orange+"18":isOrfana?C.red+"10":i%2===0?C.panel:C.panel2}}>
                                <td style={{padding:"7px 8px"}} onClick={e=>e.stopPropagation()}>
                                  <input type="checkbox" checked={isSel} onChange={()=>toggleOne(p.id)}
                                    style={{width:13,height:13,cursor:"pointer",accentColor:C.accent}} />
                                </td>
                                <td style={{padding:"7px 8px",color:C.gold,fontWeight:700}}>{i+1}</td>
                                <td style={{padding:"7px 8px",color:C.muted,fontSize:10,whiteSpace:"nowrap"}}>{p.codice}</td>
                                <td style={{padding:"7px 8px",whiteSpace:"nowrap"}}>
                                  {p.ospite}
                                  {isItaSenzaCF && <span style={{color:C.orange,fontSize:10,marginLeft:4}} title="Ospite italiano senza CF valido — XML bloccato">⚠ CF</span>}
                                </td>
                                <td style={{padding:"7px 8px",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                  {isOrfana
                                    ? <span style={{color:C.red,fontSize:10}}>⚠ {p.appartamentoNome?.slice(0,16)}…</span>
                                    : <span style={{color:C.muted,fontSize:10}}>{aptNome?.slice(0,20)}</span>}
                                </td>
                                <td style={{padding:"7px 8px",whiteSpace:"nowrap"}}>{p.checkin}</td>
                                <td style={{padding:"7px 8px",whiteSpace:"nowrap"}}>{p.checkout}</td>
                                <td style={{padding:"7px 8px",textAlign:"center"}}>{p.notti}</td>
                                <td style={{padding:"7px 8px",color:isOrfana?C.red:C.green,fontWeight:700,whiteSpace:"nowrap"}}>€{p.importo.toFixed(2)}</td>
                                <td style={{padding:"7px 8px",textAlign:"center"}} title={p.importo>77.47?"Bollo €2 incluso":"Sotto soglia bollo"}>
                                  {p.importo>77.47 ? <span style={{color:C.gold,fontSize:10}}>🔖</span> : <span style={{color:C.muted,fontSize:10}}>—</span>}
                                </td>
                                {/* Status quick-change */}
                                <td style={{padding:"4px 6px"}} onClick={e=>e.stopPropagation()}>
                                  <select value={p.status||"draft"}
                                    onChange={e=>{
                                      const newStatus = e.target.value;
                                      if (newStatus === "ready" && !(p.paeseOspite||"").trim()) {
                                        alert("⚠ Imposta la nazionalità dell'ospite prima di impostare la prenotazione come \"Pronta\".");
                                        e.target.value = p.status||"draft";
                                        return;
                                      }
                                      onUpdatePrenotazione && onUpdatePrenotazione({...p,status:newStatus});
                                    }}
                                    style={{background:"none",border:`1px solid ${st.color}44`,borderRadius:4,
                                      color:st.color,fontSize:10,fontWeight:700,padding:"3px 5px",cursor:"pointer",outline:"none",
                                      appearance:"none",WebkitAppearance:"none"}}>
                                    {STATUS_KEYS.map(k=>(
                                      <option key={k} value={k}>{STATUSES[k].emoji} {STATUSES[k].label}</option>
                                    ))}
                                  </select>
                                </td>
                                {/* Modifica */}
                                <td style={{padding:"7px 4px"}} onClick={e=>e.stopPropagation()}>
                                  <button onClick={()=>startEdit(p)}
                                    style={{background:"none",border:"none",color:C.gold,cursor:"pointer",fontSize:12,padding:"0 3px",lineHeight:1,opacity:0.7}}
                                    title="Modifica">✏️</button>
                                </td>
                                {/* Elimina */}
                                <td style={{padding:"7px 4px"}} onClick={e=>e.stopPropagation()}>
                                  <button onClick={()=>{if(window.confirm(`Eliminare prenotazione di ${p.ospite}?`)) onDeletePrenotazioni([p.id]);}}
                                    style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:"0 3px",lineHeight:1,opacity:0.7}}
                                    title="Elimina">✕</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{background:"#0a1f0a"}}>
                            <td colSpan={9} style={{padding:"9px 8px",fontSize:10,color:C.muted,fontWeight:700}}>TOTALE VISIBILE</td>
                            <td style={{padding:"9px 8px",fontWeight:700}}>{filteredPren.reduce((s,p)=>s+p.notti,0)}</td>
                            <td style={{padding:"9px 8px",color:C.green,fontWeight:700,fontSize:13}}>€{filteredPren.reduce((s,p)=>s+p.importo,0).toFixed(2)}</td>
                            <td colSpan={2}/>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Legenda */}
                    <div style={{display:"flex",gap:16,marginTop:8,fontSize:10,color:C.muted,flexWrap:"wrap"}}>
                      <span><span style={{color:C.accent}}>■</span> Selezionata</span>
                      <span><span style={{color:C.red}}>■</span> Orfana</span>
                      <span><span style={{color:C.orange}}>■</span> 🇮🇹 CF mancante</span>
                      <span><span style={{color:C.gold}}>🔖</span> Bollo €2 (imp. {'>'} €77,47)</span>
                      {STATUS_KEYS.map(k=>(
                        <span key={k}><span style={{color:STATUSES[k].color}}>{STATUSES[k].emoji}</span> {STATUSES[k].label}: {myPren.filter(p=>(p.status||"ready")===k).length}</span>
                      ))}
                      <span style={{marginLeft:"auto"}}>{filteredPren.length}/{myPren.length} · {orfane.length} orfane · {filteredPren.filter(p=>p.importo>77.47).length} con bollo</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── DICHIARAZIONE ── */}
            {tab==="dichiarazione" && (
              <div>
                <div style={{fontSize:9,letterSpacing:"2px",color:C.purple,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>📊 Quadro RB — Redditi Fabbricati</div>
                {prop.appartamenti.length===0?(
                  <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>Aggiungi appartamenti per vedere il riepilogo.</div>
                ):prop.appartamenti.map((apt,i)=>{
                  const pren=myPren.filter(p=>p.appartamentoId===apt.id);
                  const inc=pren.reduce((s,p)=>s+p.importo,0);
                  const notti=pren.reduce((s,p)=>s+p.notti,0);
                  const aliq=i===0?0.21:0.26;
                  const ced=inc*aliq;
                  return (
                    <div key={apt.id} style={{background:C.panel2,border:`1px solid ${C.border}`,borderLeft:`3px solid ${i===0?C.green:C.orange}`,borderRadius:7,padding:"13px",marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:10}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:12}}>{apt.nome||`App. ${i+1}`}</div>
                          {apt.foglio&&<div style={{fontSize:10,color:C.purple}}>Fg.{apt.foglio} · Part.{apt.particella} · Sub.{apt.subalterno}</div>}
                        </div>
                        <Tag color={i===0?C.green:C.orange}>{i===0?"21%":"26%"} cedolare</Tag>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                        {[["Prenotazioni",pren.length,C.accent],["Notti",notti,C.text],["Incasso",`€${inc.toFixed(2)}`,C.green],["Cedolare",`€${ced.toFixed(2)}`,i===0?C.green:C.orange]].map(([l,v,c])=>(
                          <div key={l} style={{background:"#ffffff08",borderRadius:5,padding:"7px 8px"}}>
                            <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
                            <div style={{fontSize:13,fontWeight:700,color:c,marginTop:2}}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {prop.appartamenti.length>0&&(
                  <div style={{background:"#0a1f0a",border:`1px solid ${C.green}40`,borderRadius:8,padding:"13px",marginTop:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                      {[
                        ["Totale incassi",`€${totIncasso.toFixed(2)}`,C.green],
                        ["Cedolare",`€${prop.appartamenti.reduce((s,a,i)=>{const inc=myPren.filter(p=>p.appartamentoId===a.id).reduce((x,p)=>x+p.importo,0);return s+inc*(i===0?0.21:0.26);},0).toFixed(2)}`,C.orange],
                        ["Ritenute 21%",`€${(totIncasso*0.21).toFixed(2)}`,C.accent],
                      ].map(([l,v,c])=>(
                        <div key={l}>
                          <div style={{fontSize:10,color:C.muted}}>{l}</div>
                          <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente Validatore ─────────────────────────────────────
function ValidatoreXML() {
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0a1525,#162032)", padding:"18px 20px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:9, letterSpacing:"3px", color:C.accent, textTransform:"uppercase", marginBottom:4 }}>Controllo pre-invio SDI</div>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>🔍 Valida il tuo XML</div>
        <div style={{ fontSize:11, color:C.muted }}>
          Genera le fatture dal gestionale, poi caricale su FeX per verificare tutti i campi prima dell'invio all'SDI.
        </div>
      </div>

      <div style={{ padding:"20px" }}>

        {/* Correzioni già applicate */}
        <div style={{ background:"#0a1f0a", border:`1px solid ${C.green}40`, borderRadius:8, padding:"14px 16px", marginBottom:18 }}>
          <div style={{ fontSize:10, letterSpacing:"2px", color:C.green, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>
            ✅ Correzioni già applicate al generatore XML
          </div>
          {[
            ["Data documento",    "Usa la data odierna (non il check-in futuro) — errore SDI 00403"],
            ["Natura N2.2",       "Regime forfetario → N2.2 (non soggette) invece di N1 (escluse art.15)"],
            ["Causale",           "Troncata a max 200 caratteri, codice Airbnb incluso — errore FeX 143"],
            ["Cessionario estero","IdFiscaleIVA XX/0000000 per ospiti non italiani — errore SDI 00417"],
            ["CodiceDestinatario","XXXXXXX per ospiti esteri (invece di 0000000)"],
            ["Bollo virtuale",    "€2,00 aggiunto automaticamente se importo > €77,47 — DatiBollo incluso"],
            ["Email SDI",         "ContattiTrasmittente + Contatti cedente — migliora punteggio FeX"],
            ["CodiceArticolo",    "LOC-BREVE in ogni riga — FeX Id:209"],
            ["AltriDatiGestionali","Codice prenotazione Airbnb tracciato — FeX Id:214"],
            ["SistemaEmittente",  "Attributo GestionaleAirbnb nel nodo radice — FeX Id:342"],
            ["Nome file XML",     "Formato SDI: IT{PIVA}_TD01_{PROG}.xml — FeX 'Nome file invalido' risolto"],
            ["Encoding ospite",   "Caratteri speciali (ü, ö, é…) normalizzati in ASCII — garbled text risolto"],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", gap:10, marginBottom:6, fontSize:11, lineHeight:1.5 }}>
              <span style={{ color:C.green, fontWeight:700, minWidth:160, flexShrink:0 }}>{k}</span>
              <span style={{ color:C.muted }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Istruzioni */}
        <div style={{ background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", marginBottom:18 }}>
          <div style={{ fontSize:10, letterSpacing:"2px", color:C.muted, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>
            📋 Come validare il tuo XML
          </div>
          {[
            ["1", "Vai nel tab Gestionale e genera l'XML per una prenotazione"],
            ["2", "Scarica il file .xml sul tuo computer"],
            ["3", "Apri FeX cliccando il pulsante qui sotto"],
            ["4", "Trascina o carica il file XML su FeX"],
            ["5", "Leggi il report — zero errori bloccanti = pronto per l'SDI"],
          ].map(([n, t]) => (
            <div key={n} style={{ display:"flex", gap:10, marginBottom:7, alignItems:"flex-start" }}>
              <span style={{ background:C.accent, color:"#fff", borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, flexShrink:0, marginTop:1 }}>{n}</span>
              <span style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Pulsante FeX principale */}
        <a href="https://fex-app.com" target="_blank" rel="noopener noreferrer"
          style={{ display:"block", textDecoration:"none" }}>
          <div style={{ background:"linear-gradient(135deg,#0ea5e9,#0284c7)", borderRadius:10, padding:"18px 24px",
            display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12,
            cursor:"pointer", transition:"opacity 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.9"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff", marginBottom:3 }}>
                🚀 Apri FeX — Validatore FatturaPA
              </div>
              <div style={{ fontSize:11, color:"#bae6fd" }}>
                fex-app.com · Gratuito · Specifiche v1.9 (2025) · Nessun cookie
              </div>
            </div>
            <div style={{ background:"#fff", color:"#0284c7", borderRadius:6, padding:"8px 16px", fontSize:11, fontWeight:800 }}>
              APRI →
            </div>
          </div>
        </a>

        {/* Link secondari */}
        <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
          <a href="https://www.fatturacheck.it" target="_blank" rel="noopener noreferrer"
            style={{ flex:1, minWidth:180, textDecoration:"none", background:C.panel2, border:`1px solid ${C.gold}40`,
              borderRadius:8, padding:"12px 14px", display:"block" }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.gold, marginBottom:3 }}>FatturaCheck</div>
            <div style={{ fontSize:10, color:C.muted }}>fatturacheck.it · Permette correzione diretta dell'XML</div>
          </a>
          <a href="https://ivaservizi.agenziaentrate.gov.it/portale/" target="_blank" rel="noopener noreferrer"
            style={{ flex:1, minWidth:180, textDecoration:"none", background:C.panel2, border:`1px solid ${C.border}`,
              borderRadius:8, padding:"12px 14px", display:"block" }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:3 }}>Portale AdE (ufficiale)</div>
            <div style={{ fontSize:10, color:C.muted }}>ivaservizi.agenziaentrate.gov.it · Richiede SPID</div>
          </a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TD17 COMPONENT
// ═══════════════════════════════════════════════════════════════

function parseCSVAirbnbTD17(text) {
  // Parses the Airbnb transactions CSV (Spanish/Italian headers)
  // Returns array of { codice, commissione, data, viajero, mese }
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const parseRow = line => {
    const result = []; let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === sep && !inQ) { result.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };
  // Strip BOM
  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const headers = parseRow(headerLine).map(h => h.replace(/^"|"$/g,"").trim());
  const rows = lines.slice(1).filter(l=>l.trim()).map(line => {
    const vals = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i]||"").replace(/^"|"$/g,""); });
    return obj;
  });

  const result = [];
  for (const row of rows) {
    const tipo = row["Tipo"] || row["Type"] || "";
    if (tipo !== "Reserva" && tipo !== "Reservation") continue;
    const comm = parseFloat((row["Comisión de servicio"] || row["Host service fee"] || row["Service fee"] || "0").replace(",",".")) || 0;
    if (comm <= 0) continue;
    const fechaRaw = row["Fecha"] || row["Date"] || "";
    // fecha: MM/DD/YYYY
    let dataISO = "";
    const m = fechaRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) dataISO = `${m[3]}-${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`;
    const mese = dataISO.slice(0,7); // yyyy-mm
    result.push({
      codice: row["Código de confirmación"] || row["Confirmation Code"] || "",
      commissione: comm,
      data: dataISO,
      mese,
      viajero: row["Viajero"] || row["Guest"] || "",
      lordo: parseFloat((row["Ingresos brutos"] || row["Gross earnings"] || "0").replace(",",".")) || 0,
    });
  }
  return result;
}

function TD17Panel({ proprietari }) {
  const [righe, setRighe] = useState([]);
  const [status, setStatus] = useState(null);
  const [propId, setPropId] = useState("");
  const [td17Progress, setTd17Progress] = useState(1);
  const [numFatture,  setNumFatture]  = useState({}); // { "yyyy-mm": "AIUC-xxx" }
  const [dataFatture, setDataFatture] = useState({}); // { "yyyy-mm": "yyyy-mm-dd" }
  const fileRef = useRef();

  const prop = proprietari.find(p => p.id === propId) || null;

  // Group rows by mese
  const perMese = {};
  for (const r of righe) {
    if (!perMese[r.mese]) perMese[r.mese] = [];
    perMese[r.mese].push(r);
  }
  const mesi = Object.keys(perMese).sort();

  async function onFile(file) {
    setStatus({ type:"loading", msg:"⏳ Lettura CSV..." });
    try {
      const text = await file.text();
      const parsed = parseCSVAirbnbTD17(text);
      if (!parsed.length) { setStatus({ type:"error", msg:"⚠ Nessuna commissione trovata. Assicurati che sia il CSV transazioni Airbnb." }); return; }
      setRighe(parsed);
      setStatus({ type:"ok", msg:`✓ ${parsed.length} righe con commissioni trovate in ${new Set(parsed.map(r=>r.mese)).size} mesi` });
    } catch(e) { setStatus({ type:"error", msg:"✗ " + e.message }); }
  }

  function getLastDate(r) {
    // Last payment date in the month's rows, capped to today
    const oggi = new Date().toISOString().slice(0,10);
    const dates = r.map(x => x.data).filter(Boolean).sort();
    const last = dates[dates.length - 1] || oggi;
    return last <= oggi ? last : oggi;
  }

  function scaricaTD17(mese) {
    if (!prop) { alert("⚠ Seleziona il proprietario prima di generare il TD17."); return; }
    if (!validaPIVA(prop.piva).ok || !validaCF(prop.cf).ok) { alert("⚠ Correggi P.IVA e CF del proprietario."); return; }
    const r = perMese[mese];
    const lastDate = getLastDate(r);
    const numFatt  = (numFatture[mese]  || "").trim() || null;
    const dataFatt = (dataFatture[mese] || "").trim() || null;
    const xml = generaTD17XML(prop, mese, r, td17Progress, numFatt, lastDate, dataFatt);
    const prog = String(td17Progress).padStart(5, '0');
    const fname = `IT${prop.piva}_TD${prog}.xml`;
    scaricaBlob(xml, fname);
    setTd17Progress(n => n + 1);
  }

  function scaricaTutti() {
    if (!prop) { alert("⚠ Seleziona il proprietario."); return; }
    mesi.forEach((mese, i) => {
      setTimeout(() => {
        const r = perMese[mese];
        const lastDate = getLastDate(r);
        const numFatt  = (numFatture[mese]  || "").trim() || null;
        const dataFatt = (dataFatture[mese] || "").trim() || null;
        const xml = generaTD17XML(prop, mese, r, td17Progress + i, numFatt, lastDate, dataFatt);
        const prog = String(td17Progress + i).padStart(5, '0');
        const fname = `IT${prop.piva}_TD${prog}.xml`;
        scaricaBlob(xml, fname);
      }, i * 300);
    });
    setTd17Progress(n => n + mesi.length);
  }

  return (
    <div>
      {/* Info box */}
      <div style={{background:"#0a1525",border:`1px solid ${C.gold}30`,borderRadius:8,padding:"12px 16px",marginBottom:16,fontSize:12,color:C.muted,lineHeight:1.7}}>
        💡 <strong style={{color:C.text}}>TD17 — Commissioni Airbnb:</strong> Airbnb Ireland (IE) ti addebita ~3% sul lordo.
        Dal <strong style={{color:C.gold}}>1° luglio 2022</strong> devi integrare l&apos;IVA al 22% e comunicarla all&apos;SDI via TD17
        (esterometro + reverse charge art. 17 c.2 DPR 633/72). Carica il CSV transazioni Airbnb — il sistema raggruppa tutto per mese.
      </div>

      {/* Selezione proprietario */}
      <div style={{marginBottom:14}}>
        <Lbl color={C.gold}>Proprietario</Lbl>
        {proprietari.length === 0
          ? <div style={{fontSize:12,color:C.red,padding:"8px 0"}}>⚠ Nessun proprietario configurato. Vai nel Gestionale e crea un proprietario con P.IVA e CF validi.</div>
          : <select value={propId} onChange={e=>setPropId(e.target.value)}
              style={{...BASE,width:"100%",background:C.input,border:`1px solid ${propId?C.gold:C.border}`,borderRadius:5,padding:"9px 12px",color:C.text,fontSize:13,outline:"none"}}>
              <option value="">— Seleziona proprietario —</option>
              {proprietari.map(p=>(
                <option key={p.id} value={p.id}>{p.nome} ({p.piva||"P.IVA mancante"})</option>
              ))}
            </select>
        }
      </div>

      {/* Upload CSV */}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <Lbl color={C.gold}>CSV Transazioni Airbnb</Lbl>
          {righe.length > 0 && (
            <button onClick={()=>{
              setRighe([]); setStatus(null); setNumFatture({}); setDataFatture({});
              if(fileRef.current) fileRef.current.value="";
            }} style={{...BASE,background:"transparent",border:`1px solid ${C.red}50`,color:C.red,
              padding:"3px 10px",borderRadius:4,fontSize:10,cursor:"pointer",fontWeight:700}}>
              🗑 Reset CSV
            </button>
          )}
        </div>
        {righe.length === 0
          ? <div onClick={()=>fileRef.current.click()}
              style={{border:`2px dashed ${C.gold}50`,borderRadius:8,padding:"18px",textAlign:"center",cursor:"pointer",background:C.input}}>
              <div style={{fontSize:20,marginBottom:4}}>📂</div>
              <div style={{fontSize:12,color:C.text,fontWeight:700}}>Carica CSV transazioni Airbnb</div>
              <div style={{fontSize:10,color:C.muted,marginTop:3}}>Il file "Estratto conto" o "Transazioni" scaricato da Airbnb → Portafoglio → Storico transazioni</div>
            </div>
          : <div style={{background:C.green+"12",border:`1px solid ${C.green}40`,borderRadius:8,padding:"10px 14px",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.green}}>✓ CSV caricato</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{righe.length} prenotazioni · {mesi.length} mesi · clicca "Reset CSV" per caricare un nuovo file</div>
              </div>
              <button onClick={()=>fileRef.current.click()}
                style={{...BASE,background:"transparent",border:`1px solid ${C.gold}50`,color:C.gold,
                  padding:"4px 10px",borderRadius:4,fontSize:10,cursor:"pointer"}}>
                🔄 Sostituisci
              </button>
            </div>
        }
        <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>{if(e.target.files[0])onFile(e.target.files[0]);}} />
        {status && (
          <div style={{marginTop:8,padding:"9px 13px",borderRadius:6,fontSize:11,
            background:status.type==="ok"?C.green+"15":status.type==="error"?C.red+"15":C.accent+"15",
            color:status.type==="ok"?C.green:status.type==="error"?C.red:C.accent,
            border:`1px solid ${status.type==="ok"?C.green:status.type==="error"?C.red:C.accent}40`}}>
            {status.msg}
          </div>
        )}
      </div>

      {/* Risultati per mese */}
      {mesi.length > 0 && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:"1px",textTransform:"uppercase"}}>
              {mesi.length} mesi · {righe.length} prenotazioni
            </div>
            <Btn onClick={scaricaTutti} color={C.gold} small disabled={!prop}>⬇ Scarica tutti i TD17</Btn>
          </div>

          {mesi.map(mese => {
            const r = perMese[mese];
            const totComm = r.reduce((s,x)=>s+x.commissione,0);
            const totIVA  = totComm * 0.22;
            const totLordo = r.reduce((s,x)=>s+x.lordo,0);
            const [anno, mm] = mese.split("-");
            const nomiMesi = ["","Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
            const labelMese = `${nomiMesi[parseInt(mm)]} ${anno}`;
            return (
              <div key={mese} style={{border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.gold}`,borderRadius:8,marginBottom:10,overflow:"hidden"}}>
                {/* Header mese */}
                <div style={{background:C.panel2,padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}> 
                      <span style={{fontSize:13,fontWeight:800,color:C.gold}}>{labelMese}</span>
                      <span style={{fontSize:10,color:C.muted}}>{r.length} pren. &middot; lordo €{totLordo.toFixed(2)}</span>
                      <button onClick={()=>{
                        setRighe(prev => prev.filter(x => x.mese !== mese));
                        setNumFatture(n => { const c={...n}; delete c[mese]; return c; });
                        setDataFatture(n => { const c={...n}; delete c[mese]; return c; });
                      }} title={`Rimuovi ${labelMese}`}
                        style={{...BASE,background:"transparent",border:`1px solid ${C.red}50`,color:C.red,
                          padding:"2px 8px",borderRadius:4,fontSize:9,cursor:"pointer",fontWeight:700}}>
                        ✕ rimuovi
                      </button>
                    </div>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:C.muted}}>Imponibile</div>
                        <div style={{fontSize:13,fontWeight:800,color:C.text}}>€{totComm.toFixed(2)}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:C.muted}}>IVA 22%</div>
                        <div style={{fontSize:13,fontWeight:800,color:C.orange}}>€{totIVA.toFixed(2)}</div>
                      </div>
                      <Btn onClick={()=>scaricaTD17(mese)} color={numFatture[mese]?C.gold:C.orange} small disabled={!prop}>⬇ XML</Btn>
                    </div>
                  </div>
                  {/* Numero fattura Airbnb */}
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:10,color:C.muted,flexShrink:0,whiteSpace:"nowrap"}}>N° fattura Airbnb:</div>
                    <input
                      value={numFatture[mese]||""}
                      onChange={e=>setNumFatture(n=>({...n,[mese]:e.target.value}))}
                      placeholder="es. AIUC-54194582-IT-3508457  (opzionale)"
                      style={{...BASE,flex:1,background:C.input,border:`1px solid ${numFatture[mese]?C.gold:C.border}`,
                        borderRadius:4,padding:"5px 9px",color:C.text,fontSize:10,outline:"none",fontFamily:"monospace"}}
                    />
                    {numFatture[mese]
                      ? <span style={{fontSize:9,color:C.gold,fontWeight:700,flexShrink:0}}>✓ fattura</span>
                      : <span style={{fontSize:9,color:C.orange,flexShrink:0}}>codici prenotazione</span>}
                  </div>
                  {/* Data fattura — deve essere >= ultima data pagamento del mese */}
                  {(() => {
                    const minData = getLastDate(r); // ultima data pagamento = minimo accettabile
                    const valData = dataFatture[mese] || "";
                    const dataErr = valData && valData < minData;
                    return (
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{fontSize:10,color:C.muted,flexShrink:0,whiteSpace:"nowrap"}}>Data fattura Airbnb:</div>
                        <input
                          type="date"
                          value={valData}
                          min={minData}
                          max={new Date().toISOString().slice(0,10)}
                          onChange={e=>setDataFatture(n=>({...n,[mese]:e.target.value}))}
                          style={{...BASE,background:C.input,
                            border:`1px solid ${dataErr?C.red:valData?C.gold:C.border}`,
                            borderRadius:4,padding:"5px 9px",color:C.text,fontSize:11,outline:"none"}}
                        />
                        {dataErr && (
                          <span style={{fontSize:9,color:C.red,fontWeight:700}}>
                            ⚠ deve essere ≥ {minData}
                          </span>
                        )}
                        {!valData && (
                          <span style={{fontSize:9,color:C.muted}}>
                            opzionale — ma consigliata per evitare avvisi SDI
                          </span>
                        )}
                        {valData && !dataErr && (
                          <span style={{fontSize:9,color:C.green,fontWeight:700}}>✓</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {/* Righe prenotazioni */}
                <div style={{background:C.panel,padding:"8px 14px"}}>
                  {r.map((row,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"5px 0",borderBottom:i<r.length-1?`1px solid ${C.border}40`:"none",fontSize:11}}>
                      <div style={{display:"flex",gap:10,alignItems:"center",flex:1,minWidth:0}}>
                        <span style={{color:C.accent,fontWeight:700,fontFamily:"monospace",fontSize:10}}>{row.codice}</span>
                        <span style={{color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.viajero}</span>
                        <span style={{color:C.muted,fontSize:10,flexShrink:0}}>{row.data}</span>
                      </div>
                      <div style={{display:"flex",gap:14,flexShrink:0}}>
                        <span style={{color:C.muted,fontSize:10}}>lordo €{row.lordo.toFixed(2)}</span>
                        <span style={{color:C.text,fontWeight:700}}>comm €{row.commissione.toFixed(2)}</span>
                        <span style={{color:C.orange,fontSize:10}}>+IVA €{(row.commissione*0.22).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"flex-end",gap:16,paddingTop:8,fontSize:11,fontWeight:700,borderTop:`1px solid ${C.border}`}}>
                    <span style={{color:C.muted}}>Totale imponibile:</span>
                    <span style={{color:C.text}}>€{totComm.toFixed(2)}</span>
                    <span style={{color:C.muted}}>+ IVA:</span>
                    <span style={{color:C.orange}}>€{totIVA.toFixed(2)}</span>
                    <span style={{color:C.gold}}>= €{(totComm+totIVA).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Nota codici prenotazione */}
          <div style={{background:"#12100a",border:`1px solid ${C.gold}20`,borderRadius:6,padding:"10px 14px",marginTop:8,fontSize:10,color:C.muted,lineHeight:1.8}}>
            ℹ️ <strong style={{color:C.gold}}>Come trovare il numero fattura Airbnb:</strong> Airbnb → prenotazione → <em>"Factura con IVA *XXXX"</em> → si apre la fattura con il numero tipo <strong style={{color:C.text,fontFamily:"monospace"}}>AIUC-54194582-IT-3508457</strong>.<br/>
            <strong style={{color:C.gold}}>Scadenza invio SDI:</strong> entro il <strong style={{color:C.orange}}>15 del mese successivo</strong> (es. commissioni maggio → TD17 entro 15 giugno).<br/>
            Se il campo è vuoto, vengono usati i codici prenotazione come riferimento temporaneo.
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP PRINCIPALE
// ═══════════════════════════════════════════════════════════════
export default function GestionaleAirbnb() {
  const [proprietari,  setProprietari]  = useState([]);
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [loaded,       setLoaded]       = useState(false);
  const [showToast,    setShowToast]    = useState(false);
  const [mainTab,      setMainTab]      = useState("gestionale");
  const saveTimer = useRef(null);

  // Carica da localStorage
  useEffect(() => {
    const s = loadFromStorage();
    if (s) { setProprietari(s.proprietari||[]); setPrenotazioni(s.prenotazioni||[]); }
    setLoaded(true);
  }, []);

  // Auto-salva
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToStorage(proprietari, prenotazioni);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }, 800);
  }, [proprietari, prenotazioni, loaded]);

  function addProprietario() {
    setProprietari(p=>[...p,{id:uid(),nome:"",piva:"",cf:"",email:"",indirizzo:"",cap:"",comune:"",provincia:"",regime:"RF19",sistemaEmittente:"",appartamenti:[]}]);
  }

  function updateProprietario(updated) {
    if (updated._newPren) {
      const {_newPren,...prop} = updated;
      setProprietari(p=>p.map(x=>x.id===prop.id?prop:x));
      setPrenotazioni(prev=>{
        const ex=new Set(prev.map(x=>x.codice));
        return [...prev,..._newPren.filter(p=>!ex.has(p.codice))];
      });
    } else {
      setProprietari(p=>p.map(x=>x.id===updated.id?updated:x));
    }
  }

  function deleteProprietario(id) {
    if (!window.confirm("Eliminare questo proprietario e tutte le sue prenotazioni?")) return;
    setProprietari(p=>p.filter(x=>x.id!==id));
    setPrenotazioni(p=>p.filter(x=>x.proprietarioId!==id));
  }

  function addAppartamento(propId) {
    setProprietari(p=>p.map(x=>x.id!==propId?x:{
      ...x, appartamenti:[...x.appartamenti,{id:uid(),nome:"",cin:"",indirizzo:"",comune:"",provincia:"",foglio:"",particella:"",subalterno:"",rendita:"",quota:"100"}]
    }));
  }

  // ── CASCADE DELETE: elimina appartamento + tutte le sue prenotazioni ────────
  function deleteAppartamento(propId, aptId) {
    if (!window.confirm("Eliminare l'appartamento e tutte le sue prenotazioni collegate?")) return;
    // Rimuove appartamento dal proprietario
    setProprietari(p=>p.map(x=>x.id!==propId?x:{
      ...x, appartamenti: x.appartamenti.filter(a=>a.id!==aptId)
    }));
    // Rimuove tutte le prenotazioni legate a quell'appartamento
    setPrenotazioni(p=>p.filter(x=>!(x.proprietarioId===propId && x.appartamentoId===aptId)));
  }

  function resetDati() {
    if (!window.confirm("Cancellare TUTTI i dati? Operazione irreversibile.")) return;
    localStorage.removeItem(STORAGE_KEY);
    setProprietari([]); setPrenotazioni([]);
  }

  const totaleGlobale = prenotazioni.reduce((s,p)=>s+p.importo,0);
  let progCounter = 1;
  const progMap = {};
  for (const prop of proprietari) {
    progMap[prop.id] = progCounter;
    progCounter += prenotazioni.filter(p=>p.proprietarioId===prop.id).length;
  }

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",...BASE}}>
      <div style={{color:C.muted,fontSize:14}}>⏳ Caricamento...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,...BASE,paddingBottom:40}}>
      <SaveToast show={showToast} />

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(135deg,#060c18,#0f1e35,#060c18)",borderBottom:`1px solid ${C.border}`,padding:"18px 22px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{fontSize:9,letterSpacing:"4px",color:C.gold,textTransform:"uppercase",marginBottom:5}}>Sistema Fiscale Airbnb · Multi-proprietario</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
            <div>
              <h1 style={{margin:0,fontSize:"clamp(17px,3vw,23px)",fontWeight:800}}>🏰 Gestionale Fatture & Dichiarazione</h1>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>Validazione P.IVA/CF · Fix date · Import CSV+Excel · TD01 SDI · Quadro RB · Validatore XML</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{fontSize:10,color:C.green,background:C.green+"15",border:`1px solid ${C.green}30`,borderRadius:5,padding:"4px 10px"}}>💾 Auto-save</div>
              {proprietari.length>0&&<button onClick={resetDati} style={{...BASE,background:"transparent",border:`1px solid ${C.red}40`,color:C.red,padding:"4px 10px",borderRadius:5,fontSize:10,cursor:"pointer"}}>🗑 Reset</button>}
            </div>
          </div>
          {mainTab==="gestionale" && proprietari.length>0&&(
            <div style={{display:"flex",gap:10,marginTop:12,flexWrap:"wrap"}}>
              {[[proprietari.length,"Proprietari",C.accent],[proprietari.reduce((s,p)=>s+p.appartamenti.length,0),"Appartamenti",C.gold],[prenotazioni.length,"Prenotazioni",C.purple],[`€${totaleGlobale.toFixed(2)}`,"Incasso",C.green]].map(([v,l,c])=>(
                <div key={l} style={{background:c+"12",border:`1px solid ${c}30`,borderRadius:7,padding:"7px 12px"}}>
                  <div style={{fontSize:14,fontWeight:800,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:C.muted,letterSpacing:"1px",textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN TABS ── */}
      <div style={{borderBottom:`1px solid ${C.border}`,background:C.panel,overflowX:"auto"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",minWidth:"fit-content"}}>
          {[
            {id:"gestionale", icon:"🏠", label:"Gestionale"},
            {id:"td17",       icon:"🧾", label:"TD17 Airbnb"},
            {id:"validatore", icon:"🔍", label:"Valida XML"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setMainTab(t.id)}
              style={{...BASE, padding:"13px 22px", border:"none", background:"none", cursor:"pointer",
                color: mainTab===t.id ? C.accent : C.muted,
                borderBottom: mainTab===t.id ? `2px solid ${C.accent}` : "2px solid transparent",
                fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
              {t.id==="validatore" && (
                <span style={{background:C.accent+"25",color:C.accent,borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:800}}>NUOVO</span>
              )}
              {t.id==="td17" && (
                <span style={{background:C.gold+"25",color:C.gold,borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:800}}>NUOVO</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"22px 14px 0"}}>

        {/* Gestionale */}
        {mainTab==="gestionale" && (
          <>
            {proprietari.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:48,marginBottom:14}}>🏠</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Nessun proprietario ancora</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>
                  I dati si salvano <strong style={{color:C.green}}>automaticamente</strong>.<br/>
                  La prossima apertura ritroverai tutto.
                </div>
                <Btn onClick={addProprietario} color={C.accent}>+ Aggiungi primo proprietario</Btn>
              </div>
            ):proprietari.map(prop=>(
              <ProprietarioCard key={prop.id} prop={prop}
                onUpdate={updateProprietario}
                onDelete={()=>deleteProprietario(prop.id)}
                onAddApt={()=>addAppartamento(prop.id)}
                onDeleteApt={(aptId)=>deleteAppartamento(prop.id, aptId)}
                onDeletePrenotazioni={(ids)=>setPrenotazioni(p=>p.filter(x=>!ids.includes(x.id)))}
                onAddPrenotazione={(pren)=>setPrenotazioni(p=>[...p,{...pren, id:uid(), status: (pren.paeseOspite||"").trim() ? pren.status||"draft" : "draft"}])}
                onUpdatePrenotazione={(pren)=>setPrenotazioni(p=>p.map(x=>x.id===pren.id?pren:x))}
                progressivoStart={progMap[prop.id]}
                allPrenotazioni={prenotazioni} />
            ))}
            {proprietari.length>0&&(
              <div style={{textAlign:"center",marginTop:8}}>
                <Btn onClick={addProprietario} color={C.accent} outline>+ Aggiungi altro proprietario</Btn>
              </div>
            )}
          </>
        )}

        {/* Validatore XML */}
        {mainTab==="validatore" && (
          <>
            <div style={{background:"#0a1525",border:`1px solid ${C.accent}30`,borderRadius:8,padding:"12px 16px",marginBottom:16,fontSize:12,color:C.muted,lineHeight:1.7}}>
              💡 <strong style={{color:C.text}}>Come usare il validatore:</strong> genera le fatture XML dal gestionale,
              poi carica qui ogni file (o incolla il contenuto) per verificare che tutti i campi siano corretti
              <strong style={{color:C.accent}}> prima</strong> di inviarle all'SDI. Controlla P.IVA, CF, date, province, importi e molto altro.
            </div>
            <ValidatoreXML />
          </>
        )}

        {/* TD17 */}
        {mainTab==="td17" && (
          <>
            <div style={{background:"#0d110a",border:`1px solid ${C.gold}30`,borderRadius:8,padding:"12px 16px",marginBottom:16,fontSize:12,color:C.muted,lineHeight:1.7}}>
              🧾 <strong style={{color:C.gold}}>TD17 — Commissioni Airbnb Ireland</strong>
              <br/>Carica il CSV delle transazioni Airbnb per generare automaticamente i TD17 mensili da inviare all&apos;SDI.
            </div>
            <TD17Panel proprietari={proprietari} />
          </>
        )}

        <div style={{marginTop:28,fontSize:10,color:C.muted,textAlign:"center",lineHeight:1.6,borderTop:`1px solid ${C.border}`,paddingTop:14}}>
          Dati nel browser locale · Nessun server · FatturaPA v1.2 · Verifica con un commercialista
        </div>
      </div>
    </div>
  );
}