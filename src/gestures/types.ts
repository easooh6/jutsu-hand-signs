export type HandLandmarks = {
  x: number;
  y: number;
  z: number;
}[];

export type HandGesture = {
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
};

export type DetectionResult = {
  name: string;
  tip: string;
};

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

export type FingerState = {
  angle: number;
  extended: boolean;
};

export type HandPose = {
  fingers: {
    index: FingerState;
    middle: FingerState;
    ring: FingerState;
    pinky: FingerState;
  };

  palm: PalmData;

  handedness: "Left" | "Right";
};

export type TwoHandPose = {
  hands: HandPose[];

  distance: number;

  alignment: number;
};