import { useHandTracking } from "./hooks/useHandTracking";

function App() {
  const {
    videoRef,
    landmarks,
    isReady,
    error,
  } = useHandTracking();

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width={640}
        height={480}
      />

      <p>
        Hands detected: {landmarks.length}
      </p>

      {error && <p>{error}</p>}
      {isReady && <p>Camera ready</p>}
    </div>
  );
}

export default App;