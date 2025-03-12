/***************** Funkcje pomocnicze *****************/
// Mnożenie macierzy 3x3
function multiplyMatrix3(a, b) {
  let result = [];
  for (let i = 0; i < 3; i++) {
    result[i] = [];
    for (let j = 0; j < 3; j++) {
      result[i][j] = 0;
      for (let k = 0; k < 3; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

// Transpozycja macierzy 3x3
function transposeMatrix3(m) {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ];
}

// Mnożenie macierzy 3x3 przez wektor (3x1)
function multiplyMatrixVector(R, v) {
  return {
    x: R[0][0] * v.x + R[0][1] * v.y + R[0][2] * v.z,
    y: R[1][0] * v.x + R[1][1] * v.y + R[1][2] * v.z,
    z: R[2][0] * v.x + R[2][1] * v.y + R[2][2] * v.z,
  };
}

/***************** Parametry kamery *****************/
let camera = {
  // Pozycja kamery w przestrzeni świata
  pos: { x: 0, y: 0, z: -50 },
  // Rotacje kamery (w radianach)
  pitch: 0, // obrót wokół osi X
  yaw: 0, // obrót wokół osi Y
  roll: 0, // obrót wokół osi Z
  // Ogniskowa (zoom)
  focalLength: 500,
};

/***************** Macierz rotacji kamery *****************/
// Funkcja zwraca macierz R_total, która przekształca wektory z układu kamery do układu świata.
function getCameraRotationMatrix(camera) {
  let cosYaw = Math.cos(camera.yaw),
    sinYaw = Math.sin(camera.yaw);
  let cosPitch = Math.cos(camera.pitch),
    sinPitch = Math.sin(camera.pitch);
  let cosRoll = Math.cos(camera.roll),
    sinRoll = Math.sin(camera.roll);

  // Rotacja wokół osi Y (yaw)
  let R_yaw = [
    [cosYaw, 0, sinYaw],
    [0, 1, 0],
    [-sinYaw, 0, cosYaw],
  ];
  // Rotacja wokół osi X (pitch)
  let R_pitch = [
    [1, 0, 0],
    [0, cosPitch, -sinPitch],
    [0, sinPitch, cosPitch],
  ];
  // Rotacja wokół osi Z (roll)
  let R_roll = [
    [cosRoll, -sinRoll, 0],
    [sinRoll, cosRoll, 0],
    [0, 0, 1],
  ];

  // Łączymy macierze – kolejność: yaw, pitch, roll
  let R_temp = multiplyMatrix3(R_pitch, R_yaw);
  let R_total = multiplyMatrix3(R_roll, R_temp);
  return R_total;
}

/***************** Transformacja punktów ze świata do układu kamery *****************/
// Najpierw odejmujemy pozycję kamery, a potem stosujemy odwrotną rotację (transpozycję macierzy)
function getViewTransform(camera) {
  let R_total = getCameraRotationMatrix(camera);
  let R_inv = transposeMatrix3(R_total);
  return function (worldPoint) {
    let dx = worldPoint.x - camera.pos.x;
    let dy = worldPoint.y - camera.pos.y;
    let dz = worldPoint.z - camera.pos.z;
    return {
      x: R_inv[0][0] * dx + R_inv[0][1] * dy + R_inv[0][2] * dz,
      y: R_inv[1][0] * dx + R_inv[1][1] * dy + R_inv[1][2] * dz,
      z: R_inv[2][0] * dx + R_inv[2][1] * dy + R_inv[2][2] * dz,
    };
  };
}

/***************** Rzutowanie perspektywiczne i konwersja do układu Canvas *****************/
function project(point, camera) {
  if (point.z <= 0) return null;
  return {
    x: (camera.focalLength * point.x) / point.z,
    y: (camera.focalLength * point.y) / point.z,
  };
}

function toScreen(point, canvas) {
  return {
    x: canvas.width / 2 + point.x,
    y: canvas.height / 2 - point.y,
  };
}

/***************** Definicja sceny *****************/
// Scena reprezentowana jest jako zbiór odcinków.
let sceneLines = [];

// Funkcja dodająca prostopadłościan (cuboid) do sceny
function addCuboid(x, y, z, width, height, depth) {
  let hw = width / 2,
    hh = height / 2,
    hd = depth / 2;
  let vertices = [
    { x: x - hw, y: y - hh, z: z - hd },
    { x: x + hw, y: y - hh, z: z - hd },
    { x: x + hw, y: y + hh, z: z - hd },
    { x: x - hw, y: y + hh, z: z - hd },
    { x: x - hw, y: y - hh, z: z + hd },
    { x: x + hw, y: y - hh, z: z + hd },
    { x: x + hw, y: y + hh, z: z + hd },
    { x: x - hw, y: y + hh, z: z + hd },
  ];
  let edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // tylna ściana
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4], // przednia ściana
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7], // krawędzie łączące
  ];
  edges.forEach((edge) => {
    sceneLines.push([vertices[edge[0]], vertices[edge[1]]]);
  });
}

// Przykładowa scena: ulica z budynkami po obu stronach
for (let i = -3; i <= 3; i++) {
  addCuboid(-30, 0, i * 40 + 100, 20, 40, 30); // budynki po lewej
  addCuboid(30, 0, i * 40 + 100, 20, 40, 30); // budynki po prawej
}
// Krawędzie drogi
sceneLines.push([
  { x: -5, y: 0, z: 100 },
  { x: -5, y: 0, z: 300 },
]);
sceneLines.push([
  { x: 5, y: 0, z: 100 },
  { x: 5, y: 0, z: 300 },
]);

/***************** Rysowanie sceny *****************/
function drawScene() {
  let canvas = document.getElementById("miasto");
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let transform = getViewTransform(camera);

  ctx.beginPath();
  sceneLines.forEach((line) => {
    let p1Cam = transform(line[0]);
    let p2Cam = transform(line[1]);
    let p1Proj = project(p1Cam, camera);
    let p2Proj = project(p2Cam, camera);
    if (p1Proj && p2Proj) {
      let p1Screen = toScreen(p1Proj, canvas);
      let p2Screen = toScreen(p2Proj, canvas);
      ctx.moveTo(p1Screen.x, p1Screen.y);
      ctx.lineTo(p2Screen.x, p2Screen.y);
    }
  });
  ctx.strokeStyle = "black";
  ctx.stroke();
}

/***************** Obsługa klawiatury *****************/
// Translacja wykonywana jest w układzie kamery – ruchy (w przód, w bok, w górę) są definiowane lokalnie,
// a następnie przekształcane na współrzędne świata.
document.addEventListener("keydown", function (e) {
  const moveStep = 5;
  const angleStep = (Math.PI / 180) * 5; // 5 stopni
  let localMove = { x: 0, y: 0, z: 0 };

  switch (e.key) {
    // Translacja – ruchy w układzie kamery
    case "w": // do przodu (lokalnie wzdłuż osi Z)
      localMove.z = moveStep;
      break;
    case "s": // do tyłu
      localMove.z = -moveStep;
      break;
    case "a": // w lewo (lokalnie ujemna oś X)
      localMove.x = -moveStep;
      break;
    case "d": // w prawo
      localMove.x = moveStep;
      break;
    case "q": // w górę (lokalnie oś Y dodatnia)
      localMove.y = moveStep;
      break;
    case "e": // w dół
      localMove.y = -moveStep;
      break;
    // Obrót kamery – modyfikujemy kąty
    case "ArrowUp":
      camera.pitch += angleStep;
      break;
    case "ArrowDown":
      camera.pitch -= angleStep;
      break;
    case "ArrowLeft":
      camera.yaw += angleStep;
      break;
    case "ArrowRight":
      camera.yaw -= angleStep;
      break;
    case "r":
      camera.roll += angleStep;
      break;
    case "f":
      camera.roll -= angleStep;
      break;
    // Zoom – zmiana ogniskowej
    case "z":
      camera.focalLength += 20;
      break;
    case "x":
      camera.focalLength -= 20;
      if (camera.focalLength < 20) camera.focalLength = 20;
      break;
  }

  // Jeśli zadeklarowaliśmy ruch translacyjny, przekształcamy go z układu kamery do świata
  if (localMove.x !== 0 || localMove.y !== 0 || localMove.z !== 0) {
    let R_total = getCameraRotationMatrix(camera);
    let worldMove = multiplyMatrixVector(R_total, localMove);
    camera.pos.x += worldMove.x;
    camera.pos.y += worldMove.y;
    camera.pos.z += worldMove.z;
  }
  drawScene();
});

/***************** Inicjalizacja *****************/
drawScene();
