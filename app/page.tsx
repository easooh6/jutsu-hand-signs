import { MainMenu } from "@/components/main-menu";

export default function Home() {
  return (
    <main className="dungeon" aria-labelledby="dungeon-title">
      <div className="dungeon__backdrop" aria-hidden="true" />
      <div className="dungeon__veil" aria-hidden="true" />

      <header className="dungeon__header">
        <h1 id="dungeon-title" className="dungeon__title">
          ZOMBIE JUTSU DUNGEON
        </h1>
      </header>

      <MainMenu />
    </main>
  );
}
