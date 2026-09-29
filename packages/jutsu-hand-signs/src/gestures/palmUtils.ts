export type Point = {
  x: number;
  y: number;
  z: number;
};

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type PalmData = {
  center: Point;
  scale: number;
  width: number;
  height: number;
  normal: Vector3;
  direction: Vector3;
};


export function calculatePalmCenter(
  landmarks: Point[]
): Point {
  const points = [
    landmarks[0],  // wrist
    landmarks[5],  // index MCP
    landmarks[9],  // middle MCP
    landmarks[13], // ring MCP
    landmarks[17], // pinky MCP
  ];

  const center = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
      z: sum.z + point.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: center.x / points.length,
    y: center.y / points.length,
    z: center.z / points.length,
  };
}

export function calculatePalmScale(
  landmarks: Point[]
): number {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  return Math.sqrt(
    (middleMcp.x - wrist.x) ** 2 +
    (middleMcp.y - wrist.y) ** 2 +
    (middleMcp.z - wrist.z) ** 2
  );
}

export function calculatePalmWidth(
  landmarks: Point[]
): number {
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];

  return Math.sqrt(
    (pinkyMcp.x - indexMcp.x) ** 2 +
    (pinkyMcp.y - indexMcp.y) ** 2 +
    (pinkyMcp.z - indexMcp.z) ** 2
  );
}

export function calculatePalmHeight(
  landmarks: Point[]
): number {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  return Math.sqrt(
    (middleMcp.x - wrist.x) ** 2 +
    (middleMcp.y - wrist.y) ** 2 +
    (middleMcp.z - wrist.z) ** 2
  );
}

export function calculatePalmNormal(
  landmarks: Point[]
): Vector3 {
  const wrist = landmarks[0];

  const indexMcp = landmarks[5];

  const middleMcp = landmarks[9];

  const u = {
    x: middleMcp.x - wrist.x,
    y: middleMcp.y - wrist.y,
    z: middleMcp.z - wrist.z,
  };

  const v = {
    x: indexMcp.x - wrist.x,
    y: indexMcp.y - wrist.y,
    z: indexMcp.z - wrist.z,
  };

  const normal = {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x,
  };

  return normalizeVector(normal);
}

export function normalizeVector(
  vector: Vector3
): Vector3 {
  const length = Math.sqrt(
    vector.x ** 2 +
    vector.y ** 2 +
    vector.z ** 2
  );

  if (length === 0) {
    return {
      x: 0,
      y: 0,
      z: 0,
    };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

export function calculateDotProduct(
  a: Vector3,
  b: Vector3
): number {
  return (
    a.x * b.x +
    a.y * b.y +
    a.z * b.z
  );
}
export function calculatePalmDirection(
  landmarks: Point[]
): Vector3 {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  return normalizeVector({
    x: middleMcp.x - wrist.x,
    y: middleMcp.y - wrist.y,
    z: middleMcp.z - wrist.z,
  });
}

export function analyzePalm(
  landmarks: Point[]
): PalmData {
  return {
    center: calculatePalmCenter(landmarks),
    scale: calculatePalmScale(landmarks),
    width: calculatePalmWidth(landmarks),
    height: calculatePalmHeight(landmarks),
    normal: calculatePalmNormal(landmarks),
    direction: calculatePalmDirection(landmarks),
  };
}
export function calculateDistance(
  a: Point,
  b: Point
): number {
  return Math.sqrt(
    (b.x - a.x) ** 2 +
    (b.y - a.y) ** 2 +
    (b.z - a.z) ** 2
  );
}


