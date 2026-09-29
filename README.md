# Naruto Hand Sign Recognition

A browser-based hand gesture recognition system inspired by Naruto hand seals.

The project uses a webcam and MediaPipe Hand Landmarker to recognize Naruto hand seals and control movement using one hand.

## Features

* Real-time hand tracking through a webcam
* Recognition of Naruto hand seals
* Stable gesture detection using consecutive frames
* One-hand movement control
* Fist gesture for confirmation
* Movement recalibration
* Support for two-hand Naruto seals
* Separation of continuous movement states and one-shot events

## Tech Stack

* React
* TypeScript
* Vite
* MediaPipe Tasks Vision
* Web Camera API

## Requirements

* Node.js 18+
* npm
* A webcam
* Modern browser with camera access
* GPU acceleration is recommended for MediaPipe

## Installation

Clone the repository:

```bash
git clone https://github.com/easooh6/jutsu-hand-signs.git
cd jutsu-hand-signs
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the address shown by Vite, usually:

```text
http://localhost:5173
```

Allow the browser to access the webcam.

## Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## How It Works

The application uses MediaPipe Hand Landmarker to detect hand landmarks from the webcam.

The landmarks are converted into a `HandPose`, which contains:

* finger states
* palm center
* palm direction
* palm normal
* hand side (`Left` / `Right`)

The application then uses this information for movement, confirmation, and Naruto seal recognition.

### One Hand

When only one hand is detected, the right hand is used for:

* movement
* confirmation

Movement is determined from the palm center relative to the calibrated neutral position.

Available movement states:

```text
left
right
up
down
idle
preparing
```

### Two Hands

When two hands are detected, movement and confirmation are disabled.

The system switches to Naruto seal recognition.

Currently supported seals:

```text
tiger
dog
boar
horse
```

## Movement Calibration

When the hand controller starts, it performs an initial calibration.

The first **2 seconds** are used to determine the neutral hand position.

During this period the movement state is:

```text
preparing
```

After calibration, the average hand position becomes:

```text
neutralX
neutralY
```

Movement is calculated relative to this position.

## Movement Parameters

The main movement parameters are defined in `handController.ts`.

### Movement threshold

```ts
const MOVEMENT_THRESHOLD = 0.12;
```

This determines how far the hand must move from the neutral position before movement is detected.

Increasing it:

```text
0.12 → 0.18
```

makes movement less sensitive.

Decreasing it:

```text
0.12 → 0.08
```

makes movement more sensitive.

### Dead zone

```ts
const DEAD_ZONE = 0.05;
```

The dead zone prevents small hand movements and tracking noise from being interpreted as movement.

### Neutral adaptation

```ts
const NEUTRAL_ADAPTATION = 0.02;
```

When the hand is inside the dead zone, the neutral position slowly follows the hand.

This compensates for small natural changes in the user's position.

### Initial calibration time

```ts
const PREPARATION_TIME = 2000;
```

The initial neutral position is calculated during this period.

The value is specified in milliseconds.

## Movement Recalibration

The movement controller supports manual recalibration.

From `GameScreen`:

```ts
const {
  recalibrate,
} = useHandTracking();
```

Then call:

```ts
recalibrate();
```

The system collects hand coordinates for:

```ts
const RECALIBRATION_TIME = 1500;
```

After that, the average position becomes the new neutral position.

This is useful when:

* the user changes their position
* the camera moves
* the user wants to change the default hand position

During recalibration the movement state is:

```text
preparing
```

## Confirmation Gesture

A fist is used as a confirmation gesture.

The confirmation is detected when all four tracked fingers are bent:

```text
index   → bent
middle  → bent
ring    → bent
pinky   → bent
```

The fist must remain stable for:

```ts
const REQUIRED_FIST_FRAMES = 5;
```

The event is generated only once.

Holding the fist does not continuously generate confirmation events.

When the fist is released and formed again, another confirmation can be generated.

## Naruto Seal Stabilization

Naruto seals are also stabilized using consecutive frames.

The current configuration requires:

```ts
const REQUIRED_SEAL_FRAMES = 5;
```

A seal must therefore be detected for five consecutive frames before it becomes a confirmed event.

For example:

```text
Frame 1 → Tiger
Frame 2 → Tiger
Frame 3 → Tiger
Frame 4 → Tiger
Frame 5 → Tiger
           ↓
       Tiger event
```

If another gesture appears before five consecutive frames:

```text
Tiger
Tiger
Unknown
Tiger
```

the candidate is reset.

This prevents accidental events caused by MediaPipe landmark jitter.

## Events

The hook separates continuous movement from one-shot events.

Movement:

```ts
movement
```

represents the current continuous state.

Events:

```ts
event
```

represent an action that happened once.

Possible events:

```ts
{
  type: "confirm",
  id: number
}
```

or:

```ts
{
  type: "seal",
  seal: "tiger" | "dog" | "boar" | "horse",
  id: number
}
```

The `id` changes every time a new event is generated.

This makes it possible for the game logic to react to an event without repeatedly processing the same gesture.

## Example

A game can listen for the next required seal:

```ts
const sequence = [
  "tiger",
  "dog",
  "horse",
];

const [currentStep, setCurrentStep] =
  useState(0);
```

Then:

```ts
useEffect(() => {
  if (!event) {
    return;
  }

  if (event.type !== "seal") {
    return;
  }

  if (
    event.seal === sequence[currentStep]
  ) {
    setCurrentStep(
      (step) => step + 1
    );
  }
}, [event, currentStep]);
```

If the user performs the wrong seal, nothing happens and the application continues waiting for the required seal.

## Project Structure

```text
src/
├── gestures/
│   ├── confirmController.ts
│   ├── fingerUtils.ts
│   ├── gestureDetector.ts
│   ├── handController.ts
│   ├── narutoSeals.ts
│   ├── palmUtils.ts
│   └── types.ts
│
├── hooks/
│   └── useHandTracking.ts
│
├── components/
│   ├── WelcomeScreen.tsx
│   └── GameScreen.tsx
│
└── App.tsx
```

## Main Components

### `useHandTracking`

Responsible for:

* initializing MediaPipe
* accessing the webcam
* processing video frames
* detecting hands
* creating hand poses
* movement detection
* confirmation detection
* Naruto seal detection
* movement recalibration

### `handController.ts`

Responsible for one-hand movement:

* initial calibration
* movement detection
* dead zone
* neutral adaptation
* recalibration

### `confirmController.ts`

Responsible for fist confirmation.

### `narutoSeals.ts`

Contains the recognition rules for individual Naruto seals.

### `gestureDetector.ts`

Converts MediaPipe landmarks into `HandPose` and `TwoHandPose`.

## Adding a New Naruto Seal

Create a new seal in:

```text
src/gestures/narutoSeals.ts
```

A seal has the following structure:

```ts
export const exampleSeal: NarutoSeal = {
  name: "Example",
  tip: "Example seal",

  check: (pose) => {
    // recognition conditions
    return true;
  },
};
```

Then import it into `useHandTracking.ts` and add it to the detection order.

The corresponding event should use a value from `SealName`.

## Browser Permissions

The application requires camera access.

If the camera does not start:

1. Check browser camera permissions.
2. Make sure no other application is using the webcam.
3. Reload the page.
4. Check the browser console for errors.

The application uses:

```ts
navigator.mediaDevices.getUserMedia()
```

to access the camera.

## Notes

The recognition system works with normalized MediaPipe coordinates.

Because the application uses a front-facing camera, horizontal movement is intentionally inverted:

```text
hand moves visually left  → left
hand moves visually right → right
```

Vertical movement follows the MediaPipe coordinate system:

```text
hand moves up   → up
hand moves down → down
```

Recognition thresholds may need to be adjusted depending on:

* camera position
* lighting
* distance from the camera
* user's hand size
* camera resolution

The current values are tuned for the project's webcam setup and may require adjustment for different environments.
