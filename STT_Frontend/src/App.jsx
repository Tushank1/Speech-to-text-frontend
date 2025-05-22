import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SpeechRecognitionComponent from "./components/speech_recognition";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<SpeechRecognitionComponent />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
