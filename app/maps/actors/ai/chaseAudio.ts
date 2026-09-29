import { playOneShot } from "@/components/audio";

export function playChaseSound() {
  playOneShot("/audio/game/horror_chord.ogg");
}
