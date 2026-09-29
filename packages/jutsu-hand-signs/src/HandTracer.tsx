import { useEffect, useRef, useState } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

export default function NarutoAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [detectedSeal, setDetectedSeal] = useState(
    "Покажи руки в камеру..."
  );
  const [errorTip, setErrorTip] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    // Проверяем, выпрямлен ли палец
    const isFingerExtended = (
      landmarks: any[],
      tipIdx: number,
      pipIdx: number
    ) => {
      const wrist = landmarks[0];
      const tip = landmarks[tipIdx];
      const pip = landmarks[pipIdx];

      const distTip = Math.hypot(
        tip.x - wrist.x,
        tip.y - wrist.y
      );

      const distPip = Math.hypot(
        pip.x - wrist.x,
        pip.y - wrist.y
      );

      return distTip > distPip * 1.15;
    };

    async function init() {
      try {
        // 1. Загружаем MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        // 2. Создаём детектор рук
        handLandmarker = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: "/hand_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
          }
        );

        // 3. Запрашиваем камеру
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
          },
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
          setIsReady(true);
          predictLoop();
        };
      } catch (error) {
        console.error("Ошибка:", error);
        setDetectedSeal("❌ Не удалось запустить камеру");
        setErrorTip(
          "Проверь разрешение камеры и наличие hand_landmarker.task"
        );
      }
    }

    function predictLoop() {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !handLandmarker
      ) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Размер canvas = размер видео
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Анализируем текущий кадр
      const results = handLandmarker.detectForVideo(
        video,
        performance.now()
      );

      // Очищаем предыдущий кадр
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const drawingUtils = new DrawingUtils(ctx);

      // Если нашли руки
      if (results.landmarks && results.landmarks.length > 0) {
        // Рисуем каждую найденную руку
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            {
              color: "#00ff88",
              lineWidth: 3,
            }
          );

          drawingUtils.drawLandmarks(
            landmarks,
            {
              color: "#ff0055",
              lineWidth: 1,
              radius: 4,
            }
          );
        }

        // Берём первую руку
        const hand1 = results.landmarks[0];

        // Проверяем пальцы
        const isIndexUp = isFingerExtended(
          hand1,
          8,
          6
        );

        const isMiddleUp = isFingerExtended(
          hand1,
          12,
          10
        );

        const isRingUp = isFingerExtended(
          hand1,
          16,
          14
        );

        const isPinkyUp = isFingerExtended(
          hand1,
          20,
          18
        );

        // Большой палец отдельно пока не анализируем

        /*
          Простое распознавание жестов

          ☝️ Указательный:
          index = up
          остальные = down

          ✌️ V:
          index = up
          middle = up
          ring = down
          pinky = down

          ✊ Кулак:
          все основные пальцы согнуты
        */

        if (
          isIndexUp &&
          isMiddleUp &&
          !isRingUp &&
          !isPinkyUp
        ) {
          setDetectedSeal(
            "✌️ Печать: V-жест"
          );

          setErrorTip("");
        } else if (
          isIndexUp &&
          !isMiddleUp &&
          !isRingUp &&
          !isPinkyUp
        ) {
          setDetectedSeal(
            "☝️ Печать: Указательный палец"
          );

          setErrorTip("");
        } else if (
          !isIndexUp &&
          !isMiddleUp &&
          !isRingUp &&
          !isPinkyUp
        ) {
          setDetectedSeal(
            "✊ Печать: Кулак"
          );

          setErrorTip("");
        } else {
          setDetectedSeal(
            "⚠️ Жест не распознан"
          );

          if (!isIndexUp) {
            setErrorTip(
              "Подсказка: попробуй выпрямить указательный палец"
            );
          } else if (!isMiddleUp) {
            setErrorTip(
              "Подсказка: попробуй выпрямить средний палец"
            );
          } else {
            setErrorTip(
              "Подсказка: согни остальные пальцы"
            );
          }
        }
      } else {
        setDetectedSeal(
          "👋 Покажи руки в камеру..."
        );

        setErrorTip("");
      }

      // Следующий кадр
      animationFrameId =
        requestAnimationFrame(predictLoop);
    }

    init();

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (handLandmarker) {
        handLandmarker.close();
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1
        style={{
          marginBottom: "10px",
          fontSize: "32px",
        }}
      >
        🥷 Naruto Hand Sign Analyzer
      </h1>

      <p
        style={{
          color: "#aaa",
          marginBottom: "30px",
        }}
      >
        Покажи жест рукой перед камерой
      </p>

      {/* Камера */}
      <div
        style={{
          position: "relative",
          width: "640px",
          maxWidth: "100%",
          aspectRatio: "4 / 3",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#000",
          boxShadow:
            "0 0 40px rgba(0, 255, 136, 0.15)",
        }}
      >
        {/* Видео */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
        />

        {/* Canvas поверх видео */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: "scaleX(-1)",
            pointerEvents: "none",
          }}
        />

        {/* Статус камеры */}
        {!isReady && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
              fontSize: "18px",
            }}
          >
            Запуск камеры...
          </div>
        )}
      </div>

      {/* Результат */}
      <div
        style={{
          width: "640px",
          maxWidth: "100%",
          marginTop: "25px",
          padding: "25px",
          borderRadius: "16px",
          background: "#1c1c1c",
          border: "1px solid #333",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "26px",
            fontWeight: "bold",
            marginBottom: "12px",
          }}
        >
          {detectedSeal}
        </div>

        {errorTip && (
          <div
            style={{
              color: "#ffaa00",
              fontSize: "17px",
            }}
          >
            {errorTip}
          </div>
        )}
      </div>

      {/* Информация */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginTop: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#1c1c1c",
            padding: "12px 18px",
            borderRadius: "10px",
          }}
        >
          🟢 Hand tracking
        </div>

        <div
          style={{
            background: "#1c1c1c",
            padding: "12px 18px",
            borderRadius: "10px",
          }}
        >
          🔴 21 landmark
        </div>

        <div
          style={{
            background: "#1c1c1c",
            padding: "12px 18px",
            borderRadius: "10px",
          }}
        >
          ⚡ Real-time
        </div>
      </div>
    </div>
  );
}
