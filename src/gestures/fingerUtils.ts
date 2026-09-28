export type Point = {
  x: number;
  y: number;
  z: number;
};

export type FingerState = {
  angle: number;
  extended: boolean;
};

export function calculateAngle(
  a: Point,
  b: Point,
  c: Point
): number {
  // Векторы BA и BC
  const vectorBA = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };

  const vectorBC = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: c.z - b.z,
  };

  // Скалярное произведение
  const dotProduct =
    vectorBA.x * vectorBC.x +
    vectorBA.y * vectorBC.y +
    vectorBA.z * vectorBC.z;

  // Длины векторов
  const lengthBA = Math.sqrt(
    vectorBA.x ** 2 +
    vectorBA.y ** 2 +
    vectorBA.z ** 2
  );

  const lengthBC = Math.sqrt(
    vectorBC.x ** 2 +
    vectorBC.y ** 2 +
    vectorBC.z ** 2
  );

  // Защита от деления на 0
  if (lengthBA === 0 || lengthBC === 0) {
    return 0;
  }

  // cos(angle) = (BA · BC) / (|BA| * |BC|)
  const cosAngle =
    dotProduct / (lengthBA * lengthBC);

  // Из-за погрешности вычислений значение иногда
  // может оказаться чуть больше 1 или меньше -1
  const clampedCos = Math.max(
    -1,
    Math.min(1, cosAngle)
  );

  // Радианы → градусы
  const angle =
    Math.acos(clampedCos) * (180 / Math.PI);

  return angle;
}
export function getFingerState(
  landmarks: Point[],
  mcpIndex: number,
  pipIndex: number,
  tipIndex: number,
  fingerName: string
): FingerState {
  const dipIndex = tipIndex - 1;

  const pipAngle = calculateAngle(
    landmarks[mcpIndex],
    landmarks[pipIndex],
    landmarks[dipIndex]
  );

  const dipAngle = calculateAngle(
    landmarks[pipIndex],
    landmarks[dipIndex],
    landmarks[tipIndex]
  );

  const extended =
    pipAngle > 160 &&
    dipAngle > 160;

//   console.log(fingerName, {
//     pipAngle,
//     dipAngle,
//     extended,
//   });

  return {
    angle: pipAngle,
    extended,
  };
}
export function analyzeFingers(
  landmarks: Point[],
  handedness: "Left" | "Right"
) {
  return {
    index: getFingerState(
      landmarks,
      5,
      6,
      8,
      `${handedness} index`
    ),

    middle: getFingerState(
      landmarks,
      9,
      10,
      12,
      `${handedness} middle`
    ),

    ring: getFingerState(
      landmarks,
      13,
      14,
      16,
      `${handedness} ring`
    ),

    pinky: getFingerState(
      landmarks,
      17,
      18,
      20,
      `${handedness} pinky`
    ),
  };
}