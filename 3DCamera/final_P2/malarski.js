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
// *********** Podstawowe operacje na wektorach 3D *****************/
// Odejmowanie dwóch wektorów 3D.
function odejmijWektory3D(v1, v2) {
  return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
}

// Iloczyn skalarny dwóch wektorów 3D.
function iloczynSkalarnyWektorow3D(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}
// Iloczyn wektorowy dwóch wektorów 3D.
function iloczynWektorowyWektorow3D(v1, v2) {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
}
// Normalizacja wektora 3D (przekształcenie na wektor jednostkowy).
function normalizujWektor3D(v) {
  let len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
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

/***************** Implementacja algorytmu malarskiego *****************/
// Oblicza równanie płaszczyzny trójkąta (w układzie kamery) na podstawie jego wierzchołków.
function obliczPlaszczyzne(trojkat) {
  let v0 = trojkat.kamWierz[0];
  let v1 = trojkat.kamWierz[1];
  let v2 = trojkat.kamWierz[2];
  let A = odejmijWektory3D(v1, v0);
  let B = odejmijWektory3D(v2, v0);
  let normal = normalizujWektor3D(iloczynWektorowyWektorow3D(A, B));
  return { punkt: v0, normal: normal };
}

// Sprawdza, czy wszystkie wierzchołki trójkąta (w układzie kamery) znajdują się po tej samej stronie płaszczyzny,
// co obserwator (który w układzie kamery jest w punkcie (0,0,0)).
function czyTrojkatWidoczny(plaszczyzna, trojkat) {
  let obserwator = { x: 0, y: 0, z: 0 };
  let d_obs = iloczynSkalarnyWektorow3D(
    odejmijWektory3D(obserwator, plaszczyzna.punkt),
    plaszczyzna.normal
  );
  let stronaObserwatora = d_obs >= 0 ? 1 : -1;
  for (let v of trojkat.kamWierz) {
    // Obliczamy odległość punktu od płaszczyzny
    let d = iloczynSkalarnyWektorow3D(
      odejmijWektory3D(v, plaszczyzna.punkt),
      plaszczyzna.normal
    );
    // i sprawdzamy, czy znajduje się po tej samej stronie co obserwator.
    if (d * stronaObserwatora < 0) {
      // Jeśli nie, to zwracamy false.
      return false;
    }
  }
  return true;
}

// Funkcja porównująca dwa trójkąty. Jeśli na podstawie testów płaszczyzny ustalimy, że jeden z nich
// jest bliżej obserwatora, zwracamy odpowiednią wartość. W przypadku niejednoznaczności używamy średniej
// wartości z w układzie kamery jako kryterium.
function porownajTrojkaty(trojkA, trojkB) {
  let plaszczA = obliczPlaszczyzne(trojkA);
  let plaszczB = obliczPlaszczyzne(trojkB);
  let testA = czyTrojkatWidoczny(plaszczB, trojkA);
  let testB = czyTrojkatWidoczny(plaszczA, trojkB);
  if (testA && !testB) {
    return 1; // trojkA jest bliżej obserwatora – rysujemy go później
  } else {
    return -1;
  }
}
/// Funkcja rzutująca punkt w układzie kamery na ekran
function naEkran(pt, canvas) {
  return {
    x: canvas.width * 0.5 + pt.x,
    y: canvas.height * 0.5 - pt.y,
  };
}

/***************** Przykładowa scena *****************/
// Przechowujemy segmenty linii sceny w tablicy linieSceny, każdy wpis to [p1, p2].
// Definicja trzech trójkątów w układzie świata
let trojkaty = [
  {
    wierzcholki: [
      { x: -100, y: -100, z: 300 },
      { x: 100, y: -100, z: 300 },
      { x: 0, y: 100, z: 300 },
    ],
    kolor: "rgba(255, 0, 0, 1)",
  },
  {
    wierzcholki: [
      { x: -150, y: -100, z: 500 },
      { x: -50, y: -100, z: 500 },
      { x: -100, y: 0, z: 500 },
    ],
    kolor: "rgba(0, 255, 0, 1)",
  },
  {
    wierzcholki: [
      { x: 50, y: -100, z: 400 },
      { x: 150, y: -100, z: 400 },
      { x: 100, y: 100, z: 400 },
    ],
    kolor: "rgba(0, 0, 255, 1)",
  },
];

/***************** Rysowanie sceny *****************/
function rysujScene() {
  let canvas = document.getElementById("trojkaty");
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let transformacja = pobierzTransformacjeWidoku(kamera);

  // Dla każdego trójkąta obliczamy przekształcone wierzchołki (w układzie kamery)
  trojkaty.forEach((trojk) => {
    trojk.kamWierz = trojk.wierzcholki.map((v) => transformacja(v));
  });

  // Sortujemy trójkąty wg algorytmu malarza – najpierw rysujemy te dalej
  trojkaty.sort(porownajTrojkaty);

  // Rysowanie trójkątów
  trojkaty.forEach((trojk) => {
    let proj = trojk.kamWierz.map((v) => {
      let p = rzutuj(v, kamera);
      return p ? naEkran(p, canvas) : null;
    });
    // Rysujemy tylko, jeśli wszystkie wierzchołki są widoczne
    if (proj.every((p) => p !== null)) {
      ctx.beginPath();
      ctx.moveTo(proj[0].x, proj[0].y);
      ctx.lineTo(proj[1].x, proj[1].y);
      ctx.lineTo(proj[2].x, proj[2].y);
      ctx.closePath();
      ctx.fillStyle = trojk.kolor;
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.stroke();
    }
  });
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
