// variabili globali
let tabella;
let fontOutfit;
let pronto = false;

// id del fiume selezionato 
let idFiumeSelezionato;

// massimi e minimi dell'intero dataset
let maxLunghezza = 0;
let minLunghezza = 100000;
let maxArea = 0;
let maxPortata = 0;
let maxAffluenti = 0;
let minTemperatura = 1000;
let maxTemperatura = -1000;
let minTempScala = 1000;
let maxTempScala = -1000;

let margine = 45;
let yInizioPannello = 190;
let passoRighe = 58;

// palette
let palette = {
  prugna: "#45283B",
  avorio: "#EAE6E0",
  rossoCaldo: "#E73121",
  bluFreddo: "#2C75FF"
};

async function setup() {
  // caricamento dataset e font
  tabella = await loadTable("assets/rivers_world - Data.csv", ",", "header");
  fontOutfit = await loadFont("https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4E.ttf");

  // parametri e id selezionato
  let params = getURLParams();
  idFiumeSelezionato = params.river;

  createCanvas(windowWidth, windowHeight);
  textFont(fontOutfit);
  creaPulsanteRitorno();

  // massimi e minimi mappature
  for (let i = 0; i < tabella.getRowCount(); i++) {
    let lunghezza = tabella.getNum(i, "length");
    let area = tabella.getNum(i, "area");
    let portata = tabella.getNum(i, "discharge");
    let affluenti = tabella.getNum(i, "tributaries");
    let temperatura = tabella.getNum(i, "avg_temp");
    let tMin = tabella.getNum(i, "min_temp");
    let tMax = tabella.getNum(i, "max_temp");

    if (lunghezza > maxLunghezza) {
      maxLunghezza = lunghezza;
    }
    if (lunghezza < minLunghezza) {
      minLunghezza = lunghezza;
    }
    if (area > maxArea) {
      maxArea = area;
    }
    if (portata > maxPortata) {
      maxPortata = portata;
    }
    if (affluenti > maxAffluenti) {
      maxAffluenti = affluenti;
    }
    if (temperatura < minTemperatura) {
      minTemperatura = temperatura;
    }
    if (temperatura > maxTemperatura) {
      maxTemperatura = temperatura;
    }
    if (tMin < minTempScala) {
      minTempScala = tMin;
    }
    if (tMax > maxTempScala) {
      maxTempScala = tMax;
    }
  }

  pronto = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// pulsante per tornare alla visione d'insieme
function creaPulsanteRitorno() {
  let bottone = createButton("← Torna alla visione d'insieme");
  bottone.position(margine, 20);
  bottone.style("font-family", "Outfit, sans-serif");
  bottone.style("font-size", "13px");
  bottone.style("font-weight", "500");
  bottone.style("color", palette.avorio);
  bottone.style("background-color", palette.prugna);
  bottone.style("border", "1px solid " + palette.prugna);
  bottone.style("border-radius", "999px");
  bottone.style("padding", "9px 16px");
  bottone.style("box-shadow", "0 2px 6px rgba(69, 40, 59, 0.18)");
  bottone.style("transition", "background-color 160ms ease, color 160ms ease, transform 160ms ease");
  bottone.style("cursor", "pointer");
  bottone.mouseOver(() => {
    bottone.style("color", palette.prugna);
    bottone.style("background-color", "transparent");
    bottone.style("box-shadow", "none");
    bottone.style("transform", "translateY(-1px)");
  });
  bottone.mouseOut(() => {
    bottone.style("color", palette.avorio);
    bottone.style("background-color", palette.prugna);
    bottone.style("box-shadow", "0 2px 6px rgba(69, 40, 59, 0.18)");
    bottone.style("transform", "translateY(0)");
  });
  bottone.mousePressed(tornaIndietro);
}

function tornaIndietro() {
  window.location.href = "index.html";
}

function draw() {
  background(palette.avorio);

  if (!pronto) {
    return;
  }

  // filtro il dataset con il parametro della pagina
  let riga = tabella.findRow(idFiumeSelezionato, "id");

  if (!riga) {
    noStroke();
    fill(palette.prugna);
    textAlign(LEFT, TOP);
    textSize(20);
    text("Fiume non trovato", margine, 80);
    return;
  }

  let nome = riga.get("name");
  let continente = riga.get("continent");
  let paesi = riga.get("countries");
  let foce = riga.get("outflow");
  let lunghezza = float(riga.get("length"));
  let area = float(riga.get("area"));
  let portata = float(riga.get("discharge"));
  let affluenti = float(riga.get("tributaries"));
  let tMin = float(riga.get("min_temp"));
  let tMax = float(riga.get("max_temp"));
  let temperatura = float(riga.get("avg_temp"));

  // stesso colore calcolato nella visione d'insieme
  let valoreTemperatura = map(temperatura, minTemperatura, maxTemperatura, 0, 1);
  let colore = lerpColor(color(palette.bluFreddo), color(palette.rossoCaldo), valoreTemperatura);

  disegnaTitolo(nome, continente);

  // glifo ingrandito
  let glifoX = width * 0.2;
  disegnaGlifoGrande(glifoX, lunghezza, portata, affluenti, colore, foce);

  // pannello analitico con legenda
  let xPannello = width * 0.42;
  let larghezzaPannello = min(520, width - xPannello - margine);
  disegnaPannello(xPannello, larghezzaPannello, lunghezza, portata, affluenti,
    tMin, tMax, temperatura, area, colore);
  disegnaTesti(xPannello, larghezzaPannello, paesi, foce);
}

// titolo della pagina: nome del fiume e continente
function disegnaTitolo(nome, continente) {
  noStroke();
  fill(palette.prugna);
  textAlign(LEFT, TOP);
  textSize(28);
  text(nome, margine, 70, width - margine * 2, 70);

  fill(69, 40, 59, 160);
  textSize(12);
  text(continente.toUpperCase(), margine, 148);
}

// glifo ingrandito
function disegnaGlifoGrande(x, lunghezza, portata, affluenti, colore, foce) {
  let yTop = yInizioPannello + 10;
  let altezzaMassima = height - 90 - yTop;
  let h = map(lunghezza, minLunghezza, maxLunghezza, 60, altezzaMassima);

  // altezza del fiume più lungo del dataset
  stroke(69, 40, 59, 110);
  strokeWeight(1);
  line(x - 50, yTop, x + 50, yTop);
  line(x - 50, yTop + altezzaMassima, x + 50, yTop + altezzaMassima);
  noStroke();
  fill(69, 40, 59, 160);
  textSize(10);
  textAlign(LEFT, CENTER);
  text("sorgente", x + 58, yTop);
  text("fiume più lungo del dataset: " + formattaNumero(maxLunghezza) + " km",
    x + 58, yTop + altezzaMassima);

  // stessa spessore e rombo scalati
  let spessore = calcolaSpessore(portata) * 2.5;
  let rombo = calcolaRombo(affluenti) * 3;

  push();
  translate(x, yTop);
  stroke(colore);
  strokeWeight(spessore);
  line(0, 0, 0, h);

  // rombo 
  translate(0, h);
  rotate(QUARTER_PI);
  rectMode(CENTER);
  noStroke();
  fill(colore);
  rect(0, 0, rombo / sqrt(2), rombo / sqrt(2));
  pop();
}

// soglie di spessore
function calcolaSpessore(portata) {
  let spessore = 1;
  if (portata > maxPortata * 0.01) {
    spessore = 1.5;
  }
  if (portata > maxPortata * 0.03) {
    spessore = 2.2;
  }
  if (portata > maxPortata * 0.1) {
    spessore = 3.2;
  }
  if (portata > maxPortata * 0.3) {
    spessore = 4.3;
  }
  if (portata > maxPortata * 0.6) {
    spessore = 5.2;
  }
  return spessore;
}

// soglie di dimensione del rombo 
function calcolaRombo(affluenti) {
  let dimensione = 4;
  if (affluenti > maxAffluenti * 0.01) {
    dimensione = 5;
  }
  if (affluenti > maxAffluenti * 0.05) {
    dimensione = 7;
  }
  if (affluenti > maxAffluenti * 0.15) {
    dimensione = 9;
  }
  if (affluenti > maxAffluenti * 0.4) {
    dimensione = 12;
  }
  return dimensione;
}

// pannello con legenda e valori
function disegnaPannello(x, w, lunghezza, portata, affluenti, tMin, tMax, temperatura, area, colore) {
  let y = yInizioPannello;

  disegnaIntestazioneRiga("LUNGHEZZA", "altezza dell'asta", formattaNumero(lunghezza) + " km", x, y, w);
  disegnaBarra(x, y + 34, w, lunghezza, maxLunghezza, false, colore);

  y = y + passoRighe;
  disegnaIntestazioneRiga("PORTATA MEDIA", "spessore dell'asta", formattaNumero(portata) + " m3/s", x, y, w);
  disegnaBarra(x, y + 34, w, portata, maxPortata, true, colore);

  y = y + passoRighe;
  disegnaIntestazioneRiga("AFFLUENTI", "dimensione del rombo", formattaNumero(affluenti), x, y, w);
  disegnaBarra(x, y + 34, w, affluenti, maxAffluenti, true, colore);

  y = y + passoRighe;
  disegnaIntestazioneRiga("TEMPERATURA", "colore (da freddo a caldo)", temperatura + " C media", x, y, w);
  disegnaBarraTemperatura(x, y + 34, w, tMin, tMax, temperatura, colore);

  y = y + passoRighe + 12;
  disegnaIntestazioneRiga("BACINO", "non codificato nel glifo", formattaNumero(area) + " km2", x, y, w);
  disegnaBarra(x, y + 34, w, area, maxArea, true, colore);
}

// testo dell'etichetta conspiegazione e valore allineato a destra
function disegnaIntestazioneRiga(etichetta, spiegazione, valore, x, y, w) {
  noStroke();
  textAlign(LEFT, TOP);
  fill(palette.prugna);
  textSize(12);
  text(etichetta, x, y);

  fill(69, 40, 59, 150);
  textSize(10);
  text(spiegazione, x, y + 17);

  fill(palette.prugna);
  textSize(14);
  textAlign(RIGHT, TOP);
  text(valore, x + w, y - 2);
}

// barra che confronta il valore con il massimo
function disegnaBarra(x, y, w, valore, valoreMassimo, usaRadice, colore) {
  noStroke();
  fill(69, 40, 59, 30);
  rect(x, y, w, 8);

  let lunghezzaBarra;
  if (usaRadice) {
    lunghezzaBarra = map(sqrt(valore), 0, sqrt(valoreMassimo), 0, w);
  } else {
    lunghezzaBarra = map(valore, 0, valoreMassimo, 0, w);
  }
  lunghezzaBarra = max(lunghezzaBarra, 2);

  fill(colore);
  rect(x, y, lunghezzaBarra, 8);
}

// barra della temperatura
function disegnaBarraTemperatura(x, y, w, tMin, tMax, temperatura, colore) {
  noStroke();
  fill(69, 40, 59, 30);
  rect(x, y, w, 8);

  let xMin = map(tMin, minTempScala, maxTempScala, 0, w);
  let xMax = map(tMax, minTempScala, maxTempScala, 0, w);
  let xMedia = map(temperatura, minTempScala, maxTempScala, 0, w);

  fill(colore);
  rect(x + xMin, y, max(xMax - xMin, 2), 8);

  // segno della media
  stroke(palette.prugna);
  strokeWeight(2);
  line(x + xMedia, y - 4, x + xMedia, y + 12);

  // valori minimo e massimo
  noStroke();
  fill(69, 40, 59, 190);
  textSize(10);
  textAlign(RIGHT, TOP);
  text("min " + tMin + " C", x + xMin - 4, y + 12);
  textAlign(LEFT, TOP);
  text("max " + tMax + " C", x + xMax + 4, y + 12);
}

// paesi attraversati e foce
function disegnaTesti(x, w, paesi, foce) {
  let y = yInizioPannello + passoRighe * 5 + 30;

  noStroke();
  textAlign(LEFT, TOP);
  fill(69, 40, 59, 150);
  textSize(11);
  text("PAESI ATTRAVERSATI", x, y);
  fill(palette.prugna);
  textSize(12);
  text(paesi, x, y + 18, w, 80);

  y = y + 100;
  fill(69, 40, 59, 150);
  textSize(11);
  text("SFOCIA IN", x, y);
  fill(palette.prugna);
  textSize(12);
  text(foce, x, y + 18, w, 30);
}

// numero con separatore delle migliaia
function formattaNumero(valore) {
  return valore.toLocaleString("it-IT");
}
