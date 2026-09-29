const activeSounds = new Set<HTMLAudioElement>();

export function playOneShot(src: string) {
  const audio = new Audio(src);
  activeSounds.add(audio);

  const release = () => activeSounds.delete(audio);
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("error", release, { once: true });

  void audio.play().catch(release);
}
