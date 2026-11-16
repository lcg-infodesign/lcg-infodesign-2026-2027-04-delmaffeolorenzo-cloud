// variabili globali
let tabella;
let fontOutfit;

let maxLunghezza = 0;
let minLunghezza = 100000;
let maxPortata = 0;
let maxAffluenti = 0;
let minTemperatura = 1000;
let maxTemperatura = -1000;

let bordoGrafico = 45;
let xFineGrafico = 0;
let yAltoGrafico = 190;
let yBaseGrafico = 0;
let pannelloX = 0;
let indiceHover = -1;
// id del fiume sotto il mouse, passato alla pagina di dettaglio
let hoveredId = null;
let gruppoFiume = 0;
let posizioneNelGruppo = 0;
let xFiume = 0;
let yFoce = 0;
let passoFiumi = 0;
let margineColonna = 10;
let spazioSeparatore = 12;
let spazioSeparatoreIsole = 70;
let spazioSeparatoreCalcolato = 12;
let inizioColonna = 0;
let larghezzaColonna = 0;
let gruppiContinenti = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania", "Australia"];
let numeroFiumiPerGruppo = [0, 0, 0, 0, 0, 0, 0];

// palette
let palette = {
  prugna: "#45283B",
  avorio: "#EAE6E0",
  rossoCaldo: "#E73121",
  bluFreddo: "#2C75FF"
};

// caricamento font e dataset
async function setup() {
  tabella = await loadTable("assets/rivers_world - Data.csv", ",", "header");
  fontOutfit = await loadFont("https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1C4E.ttf");
  createCanvas(windowWidth, windowHeight);
  textFont(fontOutfit);
  xFineGrafico = width - bordoGrafico;
  yBaseGrafico = height - 243;
  pannelloX = width * 0.68;

  // massimi e minimi per mappature
  for (let i = 0; i < tabella.getRowCount(); i++) {
    let lunghezza = tabella.getNum(i, "length");
    let portata = tabella.getNum(i, "discharge");
    let affluenti = tabella.getNum(i, "tributaries");
    let temperatura = tabella.getNum(i, "avg_temp");

    if (lunghezza > maxLunghezza) {
      maxLunghezza = lunghezza;
    }
    if (lunghezza < minLunghezza) {
      minLunghezza = lunghezza;
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
    trovaGruppo(tabella.getString(i, "continent"));
    numeroFiumiPerGruppo[gruppoFiume] = numeroFiumiPerGruppo[gruppoFiume] + 1;
  }

  let spazioRiservato = gruppiContinenti.length * margineColonna * 2;
  for (let i = 0; i < gruppiContinenti.length - 1; i++) {
    calcolaSpazioSeparatore(i);
    spazioRiservato = spazioRiservato + spazioSeparatoreCalcolato;
  }
  passoFiumi = (xFineGrafico - bordoGrafico - spazioRiservato) / tabella.getRowCount();
}

// grafico
function draw() {
  background(palette.avorio);
  indiceHover = -1;

  // individuo fiume vicino al mouse dentro al gruppo continente
  let distanzaMinima = 100000;
  for (let i = 0; i < tabella.getRowCount(); i++) {
    calcolaPosizioneFiume(i);
    let distanzaX = mouseX - xFiume;
    if (distanzaX < 0) {
      distanzaX = -distanzaX;
    }
    if (distanzaX < distanzaMinima && distanzaX < passoFiumi / 2 + 1 &&
      mouseY >= yAltoGrafico - 4 && mouseY <= yFoce + 3) {
      distanzaMinima = distanzaX;
      indiceHover = i;
    }
  }

  // memorizzo l'id del fiume sotto il mouse (serve per il click)
  if (indiceHover != -1) {
    hoveredId = tabella.getString(indiceHover, "id");
  } else {
    hoveredId = null;
  }

  disegnaTitolo();
  disegnaIntestazioniContinenti();

  // ogni fiume è una riga verticale nella propria colonna continente
  for (let i = 0; i < tabella.getRowCount(); i++) {
    calcolaPosizioneFiume(i);
    let lunghezza = tabella.getNum(i, "length");
    let portata = tabella.getNum(i, "discharge");
    let affluenti = tabella.getNum(i, "tributaries");
    let temperatura = tabella.getNum(i, "avg_temp");

    disegnaGlifo(xFiume, yFoce, lunghezza, portata, affluenti, temperatura,
      i == indiceHover);
  }

  disegnaLegendaValori();
  disegnaIstruzioni();
  disegnaEtichettaHover();
}

// individuo colonna del continente del fiume.
function trovaGruppo(continente) {
  if (continente == "Africa") {
    gruppoFiume = 0;
  } else if (continente == "Asia") {
    gruppoFiume = 1;
  } else if (continente == "Europe") {
    gruppoFiume = 2;
  } else if (continente == "North America") {
    gruppoFiume = 3;
  } else if (continente == "South America") {
    gruppoFiume = 4;
  } else if (continente == "Oceania") {
    gruppoFiume = 5;
  } else {
    gruppoFiume = 6;
  }
}

// ordino le aste in ogni continente dalla più lunga alla più corta.
function calcolaPosizioneFiume(indice) {
  let continente = tabella.getString(indice, "continent");
  trovaGruppo(continente);
  let gruppoRichiesto = gruppoFiume;
  posizioneNelGruppo = 0;
  let lunghezza = tabella.getNum(indice, "length");

  for (let i = 0; i < tabella.getRowCount(); i++) {
    trovaGruppo(tabella.getString(i, "continent"));
    let altraLunghezza = tabella.getNum(i, "length");
    if (gruppoFiume == gruppoRichiesto &&
      (altraLunghezza > lunghezza || (altraLunghezza == lunghezza && i < indice))) {
      posizioneNelGruppo = posizioneNelGruppo + 1;
    }
  }

  gruppoFiume = gruppoRichiesto;

  calcolaColonna(gruppoFiume);
  xFiume = inizioColonna + margineColonna + (posizioneNelGruppo + 0.5) * passoFiumi;
  if (gruppoFiume == 6) {
    xFiume = xFiume - spazioSeparatoreIsole / 4;
  }
  let altezzaFiume = map(lunghezza, minLunghezza, maxLunghezza, 55, yBaseGrafico - yAltoGrafico);
  yFoce = yAltoGrafico + altezzaFiume;
}

// calcolo limiti del continente
function calcolaColonna(indiceGruppo) {
  inizioColonna = bordoGrafico;
  for (let i = 0; i < indiceGruppo; i++) {
    inizioColonna = inizioColonna + numeroFiumiPerGruppo[i] * passoFiumi;
    calcolaSpazioSeparatore(i);
    inizioColonna = inizioColonna + margineColonna * 2 + spazioSeparatoreCalcolato;
  }
  larghezzaColonna = numeroFiumiPerGruppo[indiceGruppo] * passoFiumi + margineColonna * 2;
}

// spazio extra tra i gruppi con pochi fiumi
function calcolaSpazioSeparatore(indiceGruppo) {
  spazioSeparatoreCalcolato = spazioSeparatore;
  if (indiceGruppo == 4 || indiceGruppo == 5) {
    spazioSeparatoreCalcolato = spazioSeparatoreIsole;
  }
}

// glifo del fiume
function disegnaGlifo(x, yFoce, lunghezza, portata, affluenti, temperatura, selezionato) {
  let valoreTemperatura = map(temperatura, minTemperatura, maxTemperatura, 0, 1);
  let colore = lerpColor(color(palette.bluFreddo), color(palette.rossoCaldo),
    valoreTemperatura);
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

  let puntoAffluenti = 4;
  if (affluenti > maxAffluenti * 0.01) {
    puntoAffluenti = 5;
  }
  if (affluenti > maxAffluenti * 0.05) {
    puntoAffluenti = 7;
  }
  if (affluenti > maxAffluenti * 0.15) {
    puntoAffluenti = 9;
  }
  if (affluenti > maxAffluenti * 0.4) {
    puntoAffluenti = 12;
  }
  if (selezionato) {
    spessore = spessore + 1;
  }

  stroke(colore);
  strokeWeight(spessore);
  line(x, yAltoGrafico, x, yFoce);

  // rombo alla fine dei fiumi
  noStroke();
  fill(colore);
  quad(x, yFoce - puntoAffluenti / 2,
    x + puntoAffluenti / 2, yFoce,
    x, yFoce + puntoAffluenti / 2,
    x - puntoAffluenti / 2, yFoce);
}

// titolo
function disegnaTitolo() {
  noStroke();
  fill(palette.prugna);
  textAlign(LEFT, TOP);
  textSize(26);
  text("I 100 fiumi più lunghi del mondo", 45, 28);
}

// intestazioni continenti
function disegnaIntestazioniContinenti() {
  stroke(69, 40, 59, 75);
  strokeWeight(1);
  line(bordoGrafico, yAltoGrafico - 25, bordoGrafico, yBaseGrafico + 10);

  for (let i = 0; i < gruppiContinenti.length; i++) {
    calcolaColonna(i);
    let xCentro = inizioColonna + margineColonna +
      numeroFiumiPerGruppo[i] * passoFiumi / 2;
    if (i == gruppiContinenti.length - 1) {
      xCentro = xCentro - spazioSeparatoreIsole / 4;
    }
    let xLinea = inizioColonna + larghezzaColonna;

    if (i < gruppiContinenti.length - 1) {
      calcolaSpazioSeparatore(i);
      stroke(69, 40, 59, 75);
      strokeWeight(1);
      line(xLinea + spazioSeparatoreCalcolato / 2, yAltoGrafico - 25,
        xLinea + spazioSeparatoreCalcolato / 2, yBaseGrafico + 10);
    }
    noStroke();
    fill(palette.prugna);
    textAlign(CENTER, TOP);
    textSize(12);
    text(gruppiContinenti[i], xCentro, 125);
    fill(69, 40, 59, 160);
    textSize(10);
    text(numeroFiumiPerGruppo[i] + " fiumi", xCentro, 145);
  }

  stroke(69, 40, 59, 75);
  strokeWeight(1);
  line(xFineGrafico, yAltoGrafico - 25, xFineGrafico, yBaseGrafico + 10);
}

// legenda
function disegnaLegendaValori() {
  let x = bordoGrafico;
  let y = height - 152;

  noStroke();
  fill(palette.prugna);
  textAlign(LEFT, TOP);
  textSize(14);
  text("LEGENDA", x, y);

  fill(69, 40, 59, 210);
  textSize(11);
  text("Altezza dell'asta = lunghezza del fiume", x, y + 28);

  stroke(palette.prugna);
  strokeWeight(1);
  line(x + 3, y + 60, x + 9, y + 60);
  strokeWeight(4);
  line(x + 12, y + 60, x + 18, y + 60);
  noStroke();
  text("Spessore dell'asta = portata", x + 28, y + 50);

  fill(palette.prugna);
  quad(x + 10, y + 72, x + 15, y + 77, x + 10, y + 82, x + 5, y + 77);
  text("Dimensione del rombo = affluenti", x + 28, y + 72);

  for (let i = 0; i < 5; i++) {
    let coloreTemperatura = lerpColor(color(palette.bluFreddo),
      color(palette.rossoCaldo), i / 4);
    stroke(coloreTemperatura);
    strokeWeight(3);
    line(x + 3 + i * 4, y + 101, x + 7 + i * 4, y + 101);
  }
  noStroke();
  fill(69, 40, 59, 210);
  text("Colore = temperatura media (freddo/caldo)",
    x + 28, y + 94, width * 0.56 - 28, 30);
}

// istruzioni di interazione 
function disegnaIstruzioni() {
  calcolaColonna(1);
  let x = inizioColonna + larghezzaColonna;
  calcolaSpazioSeparatore(1);
  x = x + spazioSeparatoreCalcolato / 2;
  let y = height - 152;
}

// nome del fiume vicino al puntatore
function disegnaEtichettaHover() {
  if (indiceHover == -1) {
    cursor(ARROW);
    return;
  }
  cursor(HAND);

  let nome = tabella.getString(indiceHover, "name");
  textSize(14);
  textAlign(LEFT, TOP);
  let larghezzaEtichetta = textWidth(nome) + 20;
  let altezzaEtichetta = 30;
  let xEtichetta = mouseX + 12;
  let yEtichetta = mouseY + 14;
  // se esce dal canvas l'etichetta va lato opposto del puntatore
  if (xEtichetta + larghezzaEtichetta > width - 10) {
    xEtichetta = mouseX - 12 - larghezzaEtichetta;
  }
  if (yEtichetta + altezzaEtichetta > height - 10) {
    yEtichetta = mouseY - altezzaEtichetta - 14;
  }

  stroke(palette.prugna);
  strokeWeight(1);
  fill(palette.avorio);
  rect(xEtichetta, yEtichetta, larghezzaEtichetta, altezzaEtichetta);
  noStroke();
  fill(palette.prugna);
  text(nome, xEtichetta + 10, yEtichetta + 7);
}

function mousePressed() {
  // click sul fiume = pagina dettaglio
  if (hoveredId != null) {
    let newURL = "detail.html?river=" + hoveredId;
    console.log(newURL);

    // Redirect nella stessa scheda
    window.location.href = newURL;
  }
}
