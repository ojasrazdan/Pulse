import { useEffect, useRef, useState } from "react";
import "./PulseCapture.css";
import { QUESTIONS } from "../data/questions";

function PulseCapture({ onResponseSaved }) {
  const [qIdx, setQIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [status, setStatus] = useState("Browser mic · no account needed");
  const [statusClass, setStatusClass] = useState("");
  const [text, setText] = useState("");
  const [hasAudio, setHasAudio] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [waveHeights, setWaveHeights] = useState(Array(24).fill(5));
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [audioBlob, setAudioBlob] = useState(null);

  const currentQuestion = QUESTIONS[qIdx];

  useEffect(() => {
    let interval;

    if (recording) {
      interval = setInterval(() => {
        setWaveHeights(
          Array(24)
            .fill(0)
            .map(() => 3 + Math.random() * 32)
        );
      }, 85);
    } else {
      setWaveHeights(Array(24).fill(5));
    }

    return () => clearInterval(interval);
  }, [recording]);

  const toggleRecording = async () => {
    if (recording) {
      stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setHasAudio(true);
        setStatus("Recording saved — submit when ready.");
        setStatusClass("live");
      };

      recorder.start();
      setRecording(true);
      setSecondsLeft(10);
      setStatus("Recording...");
      setStatusClass("live");

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setStatus("Mic unavailable — use text input below.");
      setStatusClass("err");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    setRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  const handleTextChange = (e) => {
    const value = e.target.value;
    const words = value.trim().split(/\s+/);

    if (words.length <= 50) {
      setText(value);
    }
  };

  const analyzeResponse = async ({ audioBlob, textResponse }) => {
    setAnalysisError("");
    setAnalysisLoading(true);

    try {
      const formData = new FormData();

      if (audioBlob) {
        formData.append("audio", audioBlob, "response.webm");
      }
      if (textResponse) {
        formData.append("text", textResponse);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const responseText = await res.text();
      let payload;

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch (err) {
          payload = { error: responseText };
        }
      } else {
        payload = null;
      }

      if (!res.ok) {
        const serverMessage = payload?.error || payload || `Analysis failed with status ${res.status}`;
        throw new Error(serverMessage?.message || serverMessage || `Analysis failed (status ${res.status})`);
      }

      if (!payload) {
        throw new Error(`Empty response from analysis service (status ${res.status})`);
      }

      return payload;
    } catch (error) {
      setAnalysisError(error.message || "Unable to analyze response.");
      return null;
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!hasAudio && !text.trim()) {
      return;
    }

    const payload = await analyzeResponse({ audioBlob: audioBlob ?? null, textResponse: text.trim() });

    if (!payload) {
      return;
    }

    onResponseSaved?.({
      transcript: payload.transcript,
      analysis: payload.analysis,
      submittedAt: new Date().toISOString(),
    });

    setShowThanks(true);
    setText("");
    setHasAudio(false);
    setAudioBlob(null);
    setStatus("Browser mic · no account needed");
    setStatusClass("");
  };

  const nextQuestion = () => {
    setQIdx((prev) => (prev + 1) % QUESTIONS.length);
    setShowThanks(false);
    setAnalysis(null);
    setAnalysisError("");
  };

  return (
    <div className="page">
      {!showThanks ? (
        <>
          <div className="q-card">
            <div className="q-eyebrow">Daily pulse · {currentQuestion.phase}</div>
            <div className="q-text">{currentQuestion.text}</div>
            <div className="q-foot">
              <span>Speak for up to 10 seconds</span>
              <span>50 word limit if typing</span>
            </div>
          </div>

          <div className="rec-card">
            <div className="waveform">
              {waveHeights.map((height, idx) => (
                <div
                  key={idx}
                  className={`wb ${recording ? "a" : ""}`}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            <div className="mic-row">
              <button className={`mic ${recording ? "rec" : ""}`} onClick={toggleRecording} aria-label="record">
                🎤
              </button>
              <div className={`cd ${recording ? "go" : ""}`}>{recording ? secondsLeft : "Tap to record"}</div>
              <div className={`st ${statusClass}`}>{status}</div>
            </div>

            <div className="divider"></div>

            <div className="fallback-label">
              <span>Or type your response</span>
              <span className="wc">{wordCount} / 50</span>
            </div>

            <textarea rows="3" placeholder="Type here instead..." value={text} onChange={handleTextChange} />

            <button className="sub" disabled={(wordCount === 0 && !hasAudio) || analysisLoading} onClick={handleSubmit}>
              {analysisLoading ? "Analyzing..." : "Submit response"}
            </button>
            {analysisError && <p className="analysis-error">{analysisError}</p>}
          </div>

          <div className="branding">Pulse · anonymous · aggregated data only</div>
        </>
      ) : (
        <>
          <div className="thanks">
            <div className="tick">✓</div>
            <h2>Response received</h2>
            <p>
              Your response has been recorded anonymously.
              <br />
              Leadership sees aggregated themes only.
            </p>

            {analysisLoading ? (
              <p className="analysis-loading">Analyzing voice response with AI...</p>
            ) : analysisError ? (
              <p className="analysis-error">{analysisError}</p>
            ) : null}

            <button className="again" onClick={nextQuestion}>
              Answer another question
            </button>
          </div>

          <div className="branding">Pulse · anonymous · aggregated data only</div>
        </>
      )}
    </div>
  );
}

export default PulseCapture;
