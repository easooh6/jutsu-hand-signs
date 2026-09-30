// import { useEffect } from "react";
// import { useHandTracking } from "./hooks/useHandTracking";

// function App() {
//   const {
//       videoRef,
//       landmarks,
//       movement,
//       event,
//       isPreparing,
//       isReady,
//       error,
//       recalibrate,
//       isRecalibrating,
//     } = useHandTracking();

//   useEffect(() => {
//     if (!event) {
//       return;
//     }

//     console.log("HAND EVENT:", event);
//   }, [event]);

//   return (
//     <div>
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         muted
//         width={640}
//         height={480}
//       />

//       <p>
//         Hands detected: {landmarks.length}
//       </p>

//       <p>
//         Camera: {isReady ? "ready" : "loading"}
//       </p>

//       <p>
//         Calibration:{" "}
//         {isPreparing ? "preparing" : "ready"}
//       </p>

//       <p>
//         Movement: {movement}
//       </p>

//       <p>
//         Event:{" "}
//         {event
//           ? JSON.stringify(event)
//           : "none"}
//       </p>
//         <button onClick={recalibrate}>
//           {isRecalibrating
//             ? "Recalibrating..."
//             : "Recalibrate"}
//         </button>
//       {error && <p>{error}</p>}
//     </div>
//   );
// }

// export default App;
import { TutorialPage } from "./tutorial/TutorialPage";

function App() {
  return <TutorialPage />;
}

export default App;