import React, { useState, useEffect, useRef } from "react";

// Conditional imports for icons
let Mic, MicOff, Volume2;
try {
  const LucideReact = require("lucide-react");
  Mic = LucideReact.Mic;
  MicOff = LucideReact.MicOff;
  Volume2 = LucideReact.Volume2;
} catch (e) {
  console.warn("lucide-react is not available");
  // Fallback icon components
  Mic = () => <span>🎤</span>;
  MicOff = () => <span>🎤❌</span>;
  Volume2 = () => <span>🔊</span>;
}

const VoiceChatWithSpeechRecognition = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";

  const startListening = () => {
    recognition.start();
    setListening(true);

    recognition.onresult = (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };
  };

  const stopListening = () => {
    recognition.stop();
    setListening(false);
  };

  return (
    <VoiceChatBase
      transcript={transcript}
      listening={listening}
      startListening={startListening}
      stopListening={stopListening}
    />
  );
};

const VoiceChatWithoutSpeechRecognition = () => {
  return (
    <VoiceChatBase
      transcript=""
      listening={false}
      startListening={() => {}}
      stopListening={() => {}}
    />
  );
};

const VoiceChatBase = ({
  transcript,
  listening,
  startListening,
  stopListening,
}) => {
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [textInput, setTextInput] = useState("");
  const animationRef = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const sendMessage = async (message) => {
    if (!message.trim()) {
      setError("Please enter or say something before sending.");
      return;
    }

    try {
      const response = await fetch(
        "https://e4f3-34-83-201-170.ngrok-free.app/chat_d",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: message.trim() }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResponse(data.response);
        speakResponse(data.response);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to send message.");
      }

      setTextInput("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    }
  };

  const speakResponse = (text) => {
    if (!window.speechSynthesis) {
      setError("Sorry, your browser does not support Text-to-Speech.");
      return;
    }

    const utterThis = new SpeechSynthesisUtterance(text);
    utterThis.lang = "en-US";
    utterThis.onstart = () => setIsAISpeaking(true);
    utterThis.onend = () => setIsAISpeaking(false);
    window.speechSynthesis.speak(utterThis);
  };

  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
  };

  const handleTextInputSubmit = (e) => {
    e.preventDefault();
    sendMessage(textInput);
  };

  // New useEffect to trigger sending the transcript when it changes
  useEffect(() => {
    if (transcript && listening) {
      sendMessage(transcript); // Automatically send the transcript
    }
  }, [transcript]);

  const renderVoiceAnimation = () => {
    const canvas = document.getElementById("voiceCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (listening || isAISpeaking) {
      const bars = 5;
      const barWidth = canvas.width / (2 * bars - 1);

      for (let i = 0; i < bars; i++) {
        const height = Math.random() * canvas.height;
        ctx.fillStyle = listening ? "#4CAF50" : "#2196F3";
        ctx.fillRect(
          2 * i * barWidth,
          canvas.height - height,
          barWidth,
          height
        );
      }
    }

    animationRef.current = requestAnimationFrame(renderVoiceAnimation);
  };

  useEffect(() => {
    renderVoiceAnimation();
  }, [listening, isAISpeaking]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          VoChat - Voice Conversation
        </h2>

        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={startListening}
            disabled={listening}
            className={`flex items-center justify-center px-4 py-2 rounded-full ${
              listening
                ? "bg-green-500 text-white"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } transition duration-300 ease-in-out`}
          >
            {listening ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
            {listening ? "Listening..." : "Start"}
          </button>
          <button
            onClick={stopListening}
            disabled={!listening}
            className={`flex items-center justify-center px-4 py-2 rounded-full ${
              !listening
                ? "bg-gray-300 text-gray-500"
                : "bg-red-500 text-white hover:bg-red-600"
            } transition duration-300 ease-in-out`}
          >
            <MicOff className="mr-2" />
            Stop
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleTextInputSubmit} className="mb-4">
          <input
            type="text"
            ref={textInputRef}
            value={textInput}
            onChange={handleTextInputChange}
            placeholder="Type your message here..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out"
          >
            Send
          </button>
        </form>

        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="font-semibold mb-2">You:</p>
          <p>{transcript || "..."}</p>
        </div>

        <div className="bg-blue-100 rounded-lg p-4">
          <p className="font-semibold mb-2 flex items-center">
            VoChat: {isAISpeaking && <Volume2 className="ml-2 text-blue-500" />}
          </p>
          <p>{response || "..."}</p>
        </div>

        <canvas
          id="voiceCanvas"
          width="300"
          height="50"
          className="mt-4 w-full"
        />
      </div>
    </div>
  );
};

const VoiceChat = () => {
  return <VoiceChatWithSpeechRecognition />;
};

export default VoiceChat;
