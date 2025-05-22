import React, { useState, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";

const SpeechRecognitionComponent = () => {
  const [isListening, setIsListening] = useState(false);
  const [liveInterim, setLiveInterim] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [showCorrected, setShowCorrected] = useState(false);
  const [_, forceUpdate] = useState(0); // Used to force re-render

  const finalTranscriptRef = useRef(""); // stores confirmed transcript
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  const replaceSpokenPunctuation = (text) => {
    return (
      text
        // remove filler words
        .replace(/\b(uh|um|er|ah|like|you know)\b/gi, "")
        // normalize extra spaces left after removal
        .replace(/\s{2,}/g, " ")
        // handle spoken punctuation
        .replace(/\bcomma\b/gi, ",")
        .replace(/\bperiod\b/gi, ".")
        .replace(/\bfull stop\b/gi, ".")
        .replace(/\bnew line\b/gi, "\n")
        .replace(/\bnext line\b/gi, "\n")
        .replace(/\bquestion mark\b/gi, "?")
        .replace(/\bexclamation point\b/gi, "!")
        .replace(/\bexclamation mark\b/gi, "!")
        .replace(/\bdash\b/gi, "-")
        .replace(/\bhyphen\b/gi, "-")
        .replace(/\bsemicolon\b/gi, ";")
        .replace(/\bcolon\b/gi, ":")
        .replace(/\bapostrophe\b/gi, "'")
        .replace(/\bsingle quote\b/gi, "'")
        .replace(/\bdouble quote\b/gi, '"')
        .replace(/\bquotation mark\b/gi, '"')
        .replace(/\bopen parenthesis\b/gi, "(")
        .replace(/\bclose parenthesis\b/gi, ")")
        .replace(/\bopen bracket\b/gi, "[")
        .replace(/\bclose bracket\b/gi, "]")
        .replace(/\bopen brace\b/gi, "{")
        .replace(/\bclose brace\b/gi, "}")
        .replace(/\belipsis\b/gi, "…")
        .replace(/\bslash\b/gi, "/")
        .replace(/\bbackslash\b/gi, "\\")
        .replace(/\bat sign\b/gi, "@")
        .replace(/\bpercent sign\b/gi, "%")
        .replace(/\band sign\b/gi, "&")
        .replace(/\basterisk\b/gi, "*")
        .replace(/\bhash\b/gi, "#")
        .replace(/\bdollar sign\b/gi, "$")
        .replace(/\bplus sign\b/gi, "+")
        .replace(/\bequal sign\b/gi, "=")
        .replace(/\btilde\b/gi, "~")
        .replace(/\bcaret\b/gi, "^")
        .replace(/\bunderscore\b/gi, "_")
    );
  };

  const startAutoStopTimer = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        console.log("⏹️ Mic auto-stopped after 30 seconds of silence");
      }
    }, 30000);
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Web Speech API not supported");
        return;
      }

      // Request mic access with noise suppression constraints
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          },
        })
        .then((stream) => {
          console.log("Microphone access granted with noise suppression.");
          // We do not use this stream in SpeechRecognition,
          // but this ensures the mic is accessed with those constraints
          // You can optionally add audio processing here if you want
          stream.getTracks().forEach((track) => track.stop()); // Stop tracks immediately to free mic for SpeechRecognition
        })
        .catch((err) => {
          console.error("Error accessing microphone:", err);
          alert("Could not access microphone.");
          return;
        });

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-GB";
      //   "en-US" || en-AU

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          let transcript = event.results[i][0].transcript.trim();

          // Replace spoken punctuation words with symbols/new lines
          transcript = replaceSpokenPunctuation(transcript);

          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + " ";
          } else {
            interim += transcript;
          }
        }
        setLiveInterim(interim.trim());
        forceUpdate((n) => n + 1); // ensure re-render

        startAutoStopTimer();
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
      };

      recognitionRef.current = recognition;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      clearTimeout(timeoutRef.current);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      startAutoStopTimer();
    }
  };

  const handleReset = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      clearTimeout(timeoutRef.current);
    }
    finalTranscriptRef.current = "";
    setLiveInterim("");
    setCorrectedText("");
    setShowCorrected(false);
    forceUpdate((n) => n + 1);
  };

  const handlePolish = async () => {
    const response = await fetch("http://localhost:8000/fix-grammar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: finalTranscriptRef.current.trim() }),
    });
    const data = await response.json();
    console.log(data);
    setCorrectedText(data.corrected_text);
    setShowCorrected(true);
  };

  return (
    <div className="outer_container">
      <div className="inner_container">
        <div className="inner_container_top">
          <div className="inner_container_top_top">
            <h1>Speech Recognition</h1>
          </div>
          <div className="inner_container_top_bottom">
            <div
              className="inner_container_top_bottom_outer"
              onClick={handleMicClick}
            >
              <FaMicrophone
                className={`inner_container_top_bottom_outer_icon ${
                  isListening ? "listening" : ""
                }`}
              />
              <p>{isListening ? "Mic is ON" : "Mic is OFF"}</p>
            </div>
            <button onClick={handleReset}>Reset</button>
            <button
              onClick={handlePolish}
              disabled={!finalTranscriptRef.current.trim()}
            >
              Polish Text
            </button>
          </div>
        </div>
        <div
          className="inner_container_bottom"
          style={{ whiteSpace: "pre-wrap" }}
        >
          <textarea
            placeholder="Recognized text will appear here..."
            value={
              showCorrected
                ? correctedText
                : finalTranscriptRef.current + liveInterim
            }
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default SpeechRecognitionComponent;
