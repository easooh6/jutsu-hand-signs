# Naruto Hand Sign Game

A browser-based game inspired by the anime *Naruto*, where the player uses hand signs to interact with the game.

The project combines a game interface with camera-based hand tracking and Naruto-style hand-sign recognition.

## Game Concept

The player first chooses a character and then progresses through battles against different enemies.

Instead of using traditional keyboard controls for attacks, the player performs Naruto hand signs in front of a webcam.

The general game concept is:

```text
Choose a character
       ↓
Start the battle
       ↓
Enemy appears
       ↓
Perform a hand sign
       ↓
Hand sign is recognized
       ↓
Character performs a jutsu
       ↓
Enemy takes damage
       ↓
Continue to the next battle
```

The goal is to progress through the battles until the end of the game.

## Features

* Character selection
* Browser-based game
* Camera-based hand interaction
* MediaPipe hand tracking
* Naruto hand-sign recognition
* Two-hand gesture recognition
* Hand-sign based game interaction
* Battle progression
* Naruto-inspired gameplay

## Tech Stack

* React
* TypeScript
* Vite / Vinext
* MediaPipe
* Web Camera API

## Requirements

Before running the project, make sure you have:

* Node.js `>=22.13.0`
* npm
* A working webcam
* A modern browser
* Camera permissions enabled
## Installation

Clone the repository and switch to the `merge` branch:

```bash
git clone https://github.com/easooh6/jutsu-hand-signs.git
cd jutsu-hand-signs
git checkout merge
```

Install the project dependencies:

```bash
npm run install:ci
```

Start the development server:

```bash
npm run dev
```

After that, open the address shown in the terminal in your browser.

Make sure that:

* a webcam is connected;
* the browser has permission to access the camera;
* a modern browser such as Chrome or Edge is used.

## Run the Game

Start the development server:

```bash
npm run dev
```

The terminal will display the local address of the application.

Open that address in your browser.

Usually it will be:

```text
http://localhost:5173
```

Allow the browser to access your webcam when requested.

## Playing the Game

### 1. Choose a Character

Start the application and select the character you want to play.

### 2. Allow Camera Access

The game uses the webcam to detect your hands.

When the browser asks for camera permission, select **Allow**.

### 3. Perform Hand Signs

Place your hands in front of the camera and perform the required Naruto hand sign.

The hand-tracking system analyzes the position of your fingers and palms and determines which sign you are making.

### 4. Fight Enemies

Recognized hand signs are used as game input.

The character can perform attacks or jutsu based on the detected sign.

Continue performing the required actions to progress through the battle.

### 5. Continue Through the Game

After defeating an enemy, the player continues to the next stage.

The goal is to progress through all available battles.

## MediaPipe

The game uses MediaPipe Hand Landmarker to detect the player's hands through the webcam.

MediaPipe provides 21 landmarks for each detected hand.

These landmarks are analyzed to determine:

* finger positions;
* finger states;
* palm position;
* palm orientation;
* distance between hands;
* relative position of the hands.

The information is then used to recognize Naruto hand signs.

The basic pipeline is:

```text
Webcam
   ↓
MediaPipe
   ↓
Hand landmarks
   ↓
Hand analysis
   ↓
Naruto hand sign
   ↓
Game action
```

## Supported Hand Signs

The hand-sign recognition system currently supports:

```text
Tiger
Dog
Boar
Horse
```

The exact sign required depends on the current game or tutorial state.

## Camera Requirements

For the best recognition:

* keep both hands visible;
* use sufficient lighting;
* keep your hands within the camera frame;
* avoid covering one hand with the other;
* keep a reasonable distance from the camera.

If recognition becomes unstable, move your hands slightly further from the camera and make sure both hands are clearly visible.

## Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Troubleshooting

### Camera does not start

Check that:

1. The browser has camera permission.
2. No other application is currently using the webcam.
3. The correct camera is selected.
4. The page has been reloaded after granting permission.

### Hand signs are not recognized

Try:

* improving the lighting;
* moving closer or further from the camera;
* keeping both hands completely visible;
* making the hand sign more clearly;
* keeping the hands stable for a short moment.

### The development server does not start

Try reinstalling dependencies:

```bash
rm -rf node_modules
npm install
```

Then run:

```bash
npm run dev
```

## Branches

The project contains two important branches.

### `dev`

Contains the main hand-tracking and computer-vision implementation.

It includes:

* MediaPipe integration;
* hand tracking;
* movement detection;
* hand-sign recognition;
* tutorial;
* advice system.

To run it:

```bash
git checkout dev
npm install
npm run dev
```

### `merge`

Contains the game version of the project.

It connects the hand-interaction concept with the game experience.

To run it:

```bash
git checkout merge
npm install
npm run dev
```

## Project Status

The MediaPipe-based hand-tracking and hand-sign recognition component was successfully implemented.

The original project was intended to connect this system with the complete game.

During development, one of the project participants became unavailable, so the complete integration could not be finished as originally planned.

However, the main computer-vision component was implemented and can be tested independently through the `dev` branch.

The `merge` branch contains the available game implementation.

## License

This project was created as an educational project.
