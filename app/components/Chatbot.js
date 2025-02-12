"use client";

import { useState } from "react";
import axios from "axios";

const Chatbot = () => {
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState("");  
  const [loading, setLoading] = useState(false);  

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://107.170.5.236:8000/generate", {
        prompt: `### Human: ${input}\n\n### Assistant:`,
        max_tokens: 100,
        temperature: 0.8,
        top_p: 0.95,
      });

      const assistantMessage = { role: "assistant", content: response.data.response };
      setMessages([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Chat with VolkAI</h2>

      <div className="h-80 overflow-y-auto bg-white p-3 rounded border">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 my-2 rounded ${
              msg.role === "user" ? "bg-blue-100 text-right" : "bg-gray-200 text-left"
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "VolkAI"}:</strong> {msg.content}
          </div>
        ))}
        {loading && <p className="text-gray-500">VolkAI is typing...</p>}
      </div>

      <div className="mt-4 flex">
        <input
          type="text"
          className="flex-grow p-2 border rounded-l"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
