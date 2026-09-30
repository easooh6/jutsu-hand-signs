# Naruto Hand Sign Recognition

A browser-based hand gesture recognition system inspired by Naruto hand seals.

This branch contains the main computer-vision and hand-tracking implementation of the project. It uses a webcam and MediaPipe Hand Landmarker to recognize hand movements and Naruto hand signs.

## Features

* Real-time hand tracking through a webcam
* MediaPipe Hand Landmarker integration
* Detection of up to two hands
* Finger position and state analysis
* Palm position and orientation analysis
* Recognition of Naruto hand signs
* Stable gesture detection using consecutive frames
* One-hand movement control
* Fist gesture for confirmation
* Movement calibration and recalibration
* Two-hand Naruto seal recognition
* Tutorial for learning the controls and hand signs
* Advice system for incorrect hand positions
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
* Webcam
* Modern browser with camera access
* GPU acceleration is recommended for MediaPipe

## Installation

Clone the repository:

```bash
git clone https://github.com/easooh6/jutsu-hand-signs.git
cd jutsu-hand-signs
```

Make sure you are using the `dev` branch:

```bash
git checkout dev
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will show a local address in the terminal, usually:

```text
http://localhost:5173
```

Open this address in a browser and allow access to the webcam.

## Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## How the System Works

The application uses MediaPipe Hand Landmarker to process the webcam video.

For every detected hand, MediaPipe provides 21 landmark points representing important parts of the hand, including the wrist, finger joints, and fingertips.

The application converts these landmarks into its own hand representation containing information such as:

* finger states
* palm center
* palm size
* palm orientation
* hand side (`Left` / `Right`)

This information is then used for movement detection and Naruto hand-sign recognition.

The general processing pipeline is:

```text
Webcam
   ↓
MediaPipe Hand Landmarker
   ↓
21 hand landmarks
   ↓
HandPose
   ↓
Finger and palm analysis
   ↓
Hand-sign recognition
   ↓
Tutorial / Game input
```

## One-Hand Movement

When one hand is detected, the right hand is used for movement control and confirmation.

Movement is determined from the palm position relative to the calibrated neutral position.

Possible movement states are:

```text
left
right
up
down
idle
preparing
```

The system uses basic geometric calculations such as distances, positions and angles to determine the current movement.

## Movement Calibration

When the hand controller starts, it performs an initial calibration.

The first two seconds are used to determine the user's neutral hand position.

During this period the movement state is:

```text
preparing
```

After calibration, the average hand position becomes the neutral position.

Movement is then calculated relative to this position.

The main movement parameters are defined in:

```text
src/gestures/handController.ts
```

## Movement Recalibration

The system also supports manual recalibration.

Recalibration can be triggered with:

```tsx
recalibrate();
```

The controller collects the current hand position for a short period and uses the average position as the new neutral position.

This is useful when:

* the user changes their position;
* the camera moves;
* the user wants to change the default hand position.

## Confirmation Gesture

A fist is used as a confirmation gesture.

The system checks the state of the four tracked fingers:

```text
index   → bent
middle  → bent
ring    → bent
pinky   → bent
```

The fist has to remain stable for several consecutive frames before a confirmation event is generated.

The event is generated only once. Holding the fist does not continuously generate confirmation events.

## Two-Hand Naruto Seals

When two hands are detected, the system switches from movement control to Naruto hand-sign recognition.

Currently supported seals include:

```text
tiger
dog
boar
horse
```

The recognition uses several characteristics of both hands:

* finger configuration;
* palm position;
* distance between the hands;
* relative position of the hands;
* palm orientation.

Basic vector and geometric calculations are used to compare the detected hand configuration with the required configuration of each seal.

## Naruto Seal Stabilization

Camera tracking is not perfectly stable. Even when the user keeps their hands still, the detected landmark positions can change slightly between frames.

To prevent accidental recognition, a seal has to be detected for several consecutive frames before it becomes a confirmed event.

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

If a different gesture appears before the required number of consecutive frames, the current candidate is reset.

## Tutorial

The branch contains a complete tutorial for learning the controls.

The tutorial starts with calibration and then teaches basic hand movements:

```text
Move left
Move right
Move up
Move down
```

After the movement section, the user learns the Naruto hand signs.

The current sequence is:

```text
Tiger → Dog → Boar → Horse
```

The sequence is strict.

If the tutorial expects Tiger and the user performs Dog, the tutorial does not move forward. It continues waiting for the required sign.

## Advice System

The tutorial also contains an advice system.

Instead of simply telling the user that a sign is incorrect, the system analyzes the current hand configuration and provides information about the detected problem.

Possible advice includes:

* move the hands closer together;
* move the hands further apart;
* adjust the hand position;
* correct the finger configuration;
* correct the palm orientation;
* use both hands;
* perform the expected seal.

The advice is stabilized over several frames to prevent the message from constantly changing because of small MediaPipe tracking variations.

## Events

The hand-tracking system separates continuous states from one-shot events.

Movement is represented by:

```text
movement
```

It describes the current continuous movement state.

A gesture event is represented by:

```text
event
```

Possible events include:

```text
{
  type: "confirm",
  id: number
}
```

and:

```text
{
  type: "seal",
  seal: "tiger" | "dog" | "boar" | "horse",
  id: number
}
```

The event ID changes every time a new event is generated.

This allows other parts of the application to react to an event only once instead of processing the same gesture repeatedly.

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
├── tutorial/
│   ├── TutorialPage.tsx
│   ├── tutorialController.ts
│   └── tutorial.css
│
└── App.tsx
```

## Main Components

### `useHandTracking.ts`

Responsible for:

* initializing MediaPipe;
* accessing the webcam;
* processing video frames;
* detecting hands;
* creating hand poses;
* movement detection;
* confirmation detection;
* Naruto seal detection;
* movement recalibration.

### `handController.ts`

Responsible for one-hand movement:

* initial calibration;
* movement detection;
* dead zone;
* neutral adaptation;
* recalibration.

### `confirmController.ts`

Responsible for fist confirmation.

### `narutoSeals.ts`

Contains recognition rules for the supported Naruto seals.

### `gestureDetector.ts`

Converts MediaPipe landmarks into the internal hand representation used by the recognition system.

### `TutorialPage.tsx`

Provides the user-facing tutorial and combines:

* calibration;
* movement training;
* seal training;
* strict seal progression;
* recognition feedback;
* advice.

## Browser Permissions

The application requires webcam access.

If the camera does not start:

1. Check browser camera permissions.
2. Make sure no other application is using the webcam.
3. Reload the page.
4. Check the browser console for errors.

The application uses the browser Web Camera API:

```text
navigator.mediaDevices.getUserMedia()
```

## Notes

The recognition system uses normalized MediaPipe coordinates.

Recognition can be affected by:

* camera position;
* lighting;
* distance from the camera;
* hand size;
* camera resolution.

The recognition thresholds can therefore be adjusted depending on the environment.

## Purpose of This Branch

The `dev` branch contains the main implementation of the project's computer-vision component.

It was developed as the foundation for connecting physical hand movements with the game.

The full game integration is available in the `merge` branch.

To try the actual game, switch to:

```bash
git checkout merge
```
