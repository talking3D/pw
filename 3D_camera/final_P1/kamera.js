/***************** Podstawowe operacje na macierzach *****************/
// Definiujemy podstawowe operacje na macierzach 3x3 i wektorach 3D.
// Funkcja iloczynMacierzy3x3(A, B) mnoży dwie macierze 3x3.
function iloczynMacierzy3x3(A, B) {
  let R = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let suma = 0;
      for (let k = 0; k < 3; k++) {
        suma += A[i][k] * B[k][j];
      }
      R[i][j] = suma;
    }
  }
  return R;
}

// Funkcja iloczynMacierzWektor(M, v) mnoży macierz 3x3 przez wektor 3D.
function iloczynMacierzWektor(M, v) {
  return {
    x: M[0][0] * v.x + M[0][1] * v.y + M[0][2] * v.z,
    y: M[1][0] * v.x + M[1][1] * v.y + M[1][2] * v.z,
    z: M[2][0] * v.x + M[2][1] * v.y + M[2][2] * v.z,
  };
}

// Funkcja transponujMacierz3x3(M) transponuje macierz 3x3.
function transponujMacierz3x3(M) {
  return [
    [M[0][0], M[1][0], M[2][0]],
    [M[0][1], M[1][1], M[2][1]],
    [M[0][2], M[1][2], M[2][2]],
  ];
}

/***************** Standardowe macierze rotacji (bez wzoru Rodrigueza) *****************/
// Obrót wokół lokalnej osi X o kąt `kat`.
function macierzRotacjiX(kat) {
  let c = Math.cos(kat),
    s = Math.sin(kat);
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c],
  ];
}

// Obrót wokół lokalnej osi Y o kąt `kat`.
function macierzRotacjiY(kat) {
  let c = Math.cos(kat),
    s = Math.sin(kat);
  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c],
  ];
}

// Obrót wokół lokalnej osi Z o kąt `kat`.
function macierzRotacjiZ(kat) {
  let c = Math.cos(kat),
    s = Math.sin(kat);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

/***************** Ustawienia kamery *****************/
// Przechowujemy pozycję i macierz orientacji 3×3, która przekształca współrzędne kamery na współrzędne świata.
let kamera = {
  pozycja: { x: 0, y: 0, z: -75 },
  orientacja: [
    // macierz jednostkowa => patrzy w kierunku +Z, "góra" to +Y, "prawo" to +X
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  ogniskowa: 500,
};

/***************** Rotacje lokalne (wewnętrzne) *****************/
/**
 * Rotacje są wykonywane przez mnożenie po prawej przez kamera.orientacja.
 * Np. obrocLokalnieX(kat) => orientacja = orientacja * R_x(kat).
 * Daje to rotację wewnętrzną wokół lokalnej osi X kamery.
 */
function obrocLokalnieX(kat) {
  let R = macierzRotacjiX(kat);
  kamera.orientacja = iloczynMacierzy3x3(kamera.orientacja, R);
}
function obrocLokalnieY(kat) {
  let R = macierzRotacjiY(kat);
  kamera.orientacja = iloczynMacierzy3x3(kamera.orientacja, R);
}
function obrocLokalnieZ(kat) {
  let R = macierzRotacjiZ(kat);
  kamera.orientacja = iloczynMacierzy3x3(kamera.orientacja, R);
}

/***************** Przesunięcie lokalne *****************/
/**
 * (dx, dy, dz) to przesunięcie w przestrzeni kamery (np. naprzód to (0, 0, +krok)).
 * Mnożymy przez kamera.orientacja, aby uzyskać przesunięcie w przestrzeni świata, a następnie dodajemy do kamera.pozycja.
 */
function przesunLokalnie(dx, dy, dz) {
  let wektorLokalny = { x: dx, y: dy, z: dz };
  let wektorSwiata = iloczynMacierzWektor(kamera.orientacja, wektorLokalny);
  kamera.pozycja.x += wektorSwiata.x;
  kamera.pozycja.y += wektorSwiata.y;
  kamera.pozycja.z += wektorSwiata.z;
}

/***************** Transformacja widoku (Świat → Kamera) *****************/
function pobierzTransformacjeWidoku(kamera) {
  // Odwrotność kamera.orientacja to jej transpozycja (czysta rotacja).
  let R_inv = transponujMacierz3x3(kamera.orientacja);
  let cx = kamera.pozycja.x,
    cy = kamera.pozycja.y,
    cz = kamera.pozycja.z;
  return function (punktSwiata) {
    // Najpierw przesuwamy punkt tak, aby kamera znalazła się w początku układu
    let dx = punktSwiata.x - cx;
    let dy = punktSwiata.y - cy;
    let dz = punktSwiata.z - cz;
    // Następnie obracamy przez R_inv
    return {
      x: R_inv[0][0] * dx + R_inv[0][1] * dy + R_inv[0][2] * dz,
      y: R_inv[1][0] * dx + R_inv[1][1] * dy + R_inv[1][2] * dz,
      z: R_inv[2][0] * dx + R_inv[2][1] * dy + R_inv[2][2] * dz,
    };
  };
}

/***************** Rzutowanie perspektywiczne *****************/
function rzutuj(punktKamery, kamera) {
  if (punktKamery.z <= 0) return null; // za kamerą lub na płaszczyźnie kamery
  return {
    x: (kamera.ogniskowa * punktKamery.x) / punktKamery.z,
    y: (kamera.ogniskowa * punktKamery.y) / punktKamery.z,
  };
}

function naEkran(pt, canvas) {
  return {
    x: canvas.width * 0.5 + pt.x,
    y: canvas.height * 0.5 - pt.y,
  };
}

/***************** Przykładowa scena *****************/
// Przechowujemy segmenty linii sceny w tablicy linieSceny, każdy wpis to [p1, p2].
let linieSceny = [];

function dodajBudynek(szer, wys, gl, numer = 1, stronaDomyślnie = "P") {
  // cx, cy, cz - dolny prawy róg przedniej ściany budynku
  // szer, wys, gl - szerokość, wysokość i głębokość budynku
  // numer - numer budynku (jeśli jest wiele budynków)
  // punkty wierzchołków sześcianu reprezentującego budynek
  const su = 40; // szerokość połowy ulicy
  const pu = -20; // poziom ulicy
  const ob = 50; // odległość do sąsiedniego budynku

  const strona = stronaDomyślnie == "P" ? -1 : 1; // strona budynku (prawa lub lewa)

  let cx = strona * (su / 2); // przesunięcie budynku względem szerokości ulicy
  let cy = pu; // przesunięcie budynku względem poziomu ulicy
  let cz = ob * (numer - 1); // przesunięcie budynku wzdłuż odległości do sąsiedniego budynku

  let punkty = [
    { x: cx, y: cy, z: cz }, // 0
    { x: cx + strona * szer, y: cy, z: cz }, // 1
    { x: cx + strona * szer, y: cy + wys, z: cz }, // 2
    { x: cx, y: cy + wys, z: cz }, // 3
    { x: cx, y: cy, z: cz + gl }, // 4
    { x: cx + strona * szer, y: cy, z: cz + gl }, // 5
    { x: cx + strona * szer, y: cy + wys, z: cz + gl }, // 6
    { x: cx, y: cy + wys, z: cz + gl }, // 7
  ];
  let krawedzie = [
    [0, 1], // przednia ściana - dolna krawędź
    [1, 2], // przednia ściana - boczna krawędź
    [2, 3], // przednia ściana - górna krawędź
    [3, 0], // przednia ściana - druga boczna krawędź
    [4, 5], // tylna ściana - dolna krawędź
    [5, 6], // tylna ściana - boczna krawędź
    [6, 7], // tylna ściana - górna krawędź
    [7, 4], // tylna ściana - druga boczna krawędź
    [0, 4], // ściana boczna - jedna dolna krawędź
    [1, 5], // ściana boczna - druga dolna krawędź
    [2, 6], // ściana boczna - jedna górna krawędź
    [3, 7], // ściana boczna - druga górna krawędź
  ];
  krawedzie.forEach((k) => {
    linieSceny.push([punkty[k[0]], punkty[k[1]]]);
  });
}

// const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Tworzymy kilka budynków w rzędzie.
dodajBudynek(30, 50, 30, 1); // pierwszy budynek z prawej
dodajBudynek(30, 50, 30, 2); // drugi budynek z prawej
dodajBudynek(30, 50, 30, 3); // trzeci budynek z prawej
dodajBudynek(30, 50, 30, 4); // czwarty budynek z prawej
dodajBudynek(25, 20, 40, 1, "L"); // pierwszy budynek z lewej
dodajBudynek(25, 30, 40, 2, "L"); // drugi budynek z lewej
dodajBudynek(25, 40, 40, 3, "L"); // trzeci budynek z lewej
dodajBudynek(25, 60, 40, 4, "L"); // czwarty budynek z lewej

/***************** Rysowanie sceny *****************/
function rysujScene() {
  let canvas = document.getElementById("miasto");
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let transformacja = pobierzTransformacjeWidoku(kamera);
  ctx.beginPath();
  for (let [p1Swiat, p2Swiat] of linieSceny) {
    let p1Kamera = transformacja(p1Swiat);
    let p2Kamera = transformacja(p2Swiat);
    let p1Projekcja = rzutuj(p1Kamera, kamera);
    let p2Projekcja = rzutuj(p2Kamera, kamera);
    if (p1Projekcja && p2Projekcja) {
      let ekran1 = naEkran(p1Projekcja, canvas);
      let ekran2 = naEkran(p2Projekcja, canvas);
      ctx.moveTo(ekran1.x, ekran1.y);
      ctx.lineTo(ekran2.x, ekran2.y);
    }
  }
  ctx.strokeStyle = "black";
  ctx.stroke();
}

/***************** Inicjalizacja *****************/
// Rysuj scenę po załadowaniu strony
document.addEventListener("DOMContentLoaded", () => {
  rysujScene();
});

/***************** Sterowanie klawiaturą *****************/
const krokRuchu = 35;
const krokKata = (Math.PI / 180) * 15; // 15 stopni
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    // Przesunięcia lokalne
    case "w": // naprzód
      przesunLokalnie(0, 0, krokRuchu);
      break;
    case "s": // do tyłu
      przesunLokalnie(0, 0, -krokRuchu);
      break;
    case "a": // w lewo
      przesunLokalnie(-krokRuchu, 0, 0);
      break;
    case "d": // w prawo
      przesunLokalnie(krokRuchu, 0, 0);
      break;
    case "q": // w górę
      przesunLokalnie(0, krokRuchu, 0);
      break;
    case "e": // w dół
      przesunLokalnie(0, -krokRuchu, 0);
      break;

    // Obróty lokalne
    // "ArrowUp" - obrót w górę (pitch) wokół lokalnej osi X
    case "ArrowUp":
      obrocLokalnieX(-krokKata);
      break;
    case "ArrowDown":
      obrocLokalnieX(krokKata);
      break;
    // "ArrowLeft" - obrót w lewo (yaw) wokół lokalnej osi Y
    case "ArrowLeft":
      obrocLokalnieY(-krokKata);
      break;
    case "ArrowRight":
      obrocLokalnieY(krokKata);
      break;
    // Możliwy obrót (roll)
    case "r":
      obrocLokalnieZ(krokKata);
      break;
    case "f":
      obrocLokalnieZ(-krokKata);
      break;

    // Zoom
    case "=":
      kamera.ogniskowa += 100;
      if (kamera.ogniskowa > 3000) kamera.ogniskowa = 3000;
      break;
    case "-":
      kamera.ogniskowa -= 100;
      if (kamera.ogniskowa < 20) kamera.ogniskowa = 20;
      break;
  }
  rysujScene();
});

/***************** Obsługa kliknięć w przyciski *****************/
// Obrót kamery w lewo
document.getElementById("r-lewo").onclick = () => {
  obrocLokalnieY(-krokKata);
  rysujScene();
};
// Obrót kamery w prawo
document.getElementById("r-prawo").onclick = () => {
  obrocLokalnieY(krokKata);
  rysujScene();
};
// Obrót kamery w górę
document.getElementById("r-gora").onclick = () => {
  obrocLokalnieX(-krokKata);
  rysujScene();
};
// Obrót kamery w dół
document.getElementById("r-dol").onclick = () => {
  obrocLokalnieX(krokKata);
  rysujScene();
};
// Obrót kamery wokół osi Z w lewo
document.getElementById("rz-lewo").onclick = () => {
  obrocLokalnieZ(krokKata);
  rysujScene();
};
// Obrót kamery wokół osi Z w prawo
document.getElementById("rz-prawo").onclick = () => {
  obrocLokalnieZ(-krokKata);
  rysujScene();
};
// Przesunięcie kamery do przodu
document.getElementById("t-przod").onclick = () => {
  przesunLokalnie(0, 0, krokRuchu);
  rysujScene();
};
// Przesunięcie kamery do tyłu
document.getElementById("t-tyl").onclick = () => {
  przesunLokalnie(0, 0, -krokRuchu);
  rysujScene();
};
// Przesunięcie kamery w lewo
document.getElementById("t-lewo").onclick = () => {
  przesunLokalnie(-krokRuchu, 0, 0);
  rysujScene();
};
// Przesunięcie kamery w prawo
document.getElementById("t-prawo").onclick = () => {
  przesunLokalnie(krokRuchu, 0, 0);
  rysujScene();
};
// Przesunięcie kamery w górę
document.getElementById("t-gora").onclick = () => {
  przesunLokalnie(0, krokRuchu, 0);
  rysujScene();
};
// Przesunięcie kamery w dół
document.getElementById("t-dol").onclick = () => {
  przesunLokalnie(0, -krokRuchu, 0);
  rysujScene();
};
// Zoom kamery powiększający
document.getElementById("powieksz").onclick = () => {
  kamera.ogniskowa += 20;
  if (kamera.ogniskowa > 3000) kamera.ogniskowa = 3000;
  rysujScene();
};
// Zoom kamery pomniejszający
document.getElementById("zmniejsz").onclick = () => {
  kamera.ogniskowa -= 20;
  if (kamera.ogniskowa < 20) kamera.ogniskowa = 20;
  rysujScene();
};
