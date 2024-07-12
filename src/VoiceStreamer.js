import React, { useState, useEffect, useRef } from 'react';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

const VoiceStreamer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const ws = useRef(null);
  const recorder = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3001');
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setTranscription((prev) => prev + message.text + ' ');
    };
    return () => {
      ws.current.close();
    };
  }, []);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      streamRef.current = stream;
      recorder.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: StereoAudioRecorder,
        timeSlice: 1000,
        ondataavailable: (blob) => {
          // Convert blob to ArrayBuffer to send via WebSocket
          const reader = new FileReader();
          reader.onload = () => {
            ws.current.send(reader.result);
          };
          reader.readAsArrayBuffer(blob);
        },
      });
      recorder.current.startRecording();
      setIsRecording(true);
    });
  };

  const stopRecording = () => {
    if (recorder.current) {
      recorder.current.stopRecording(() => {
        const recordedStream = streamRef.current;
        if (recordedStream) {
          recordedStream.getTracks().forEach((track) => track.stop());
        }
        setIsRecording(false);
      });
    }
  };

  return (
    <div>
      <h1>Voice Streaming App</h1>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <div>
        <h2>Transcription:</h2>
        <p>{transcription}</p>
      </div>
    </div>
  );
};

export default VoiceStreamer;
