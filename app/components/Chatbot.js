"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [maxTokens, setMaxTokens] = useState(300); // Default value changed to a middle range
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("https://dhaara.io/generate", {
        prompt: `### Context : \n\n### Human: ${input}\n\n### Assistant:`,
        max_tokens: maxTokens,
      });

      const assistantMessage = { role: "assistant", content: response.data.response };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
  };

  // Generate token options from 50 to 5000 with step of 50
  const tokenOptions = Array.from(
    { length: (5000 - 50) / 50 + 1 },
    (_, i) => 50 + i * 50
  );

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg border text-black">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-black">Chat with VolkAI</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="maxTokens" className="text-black text-sm">Max Tokens:</label>
          <select
            id="maxTokens"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="p-1 border rounded text-black bg-white w-24"
          >
            {tokenOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Box */}
      <div className="h-96 overflow-y-auto bg-gray-100 p-3 rounded-lg border">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 my-2 rounded-lg max-w-4/5 ${
              msg.role === "user"
                ? "bg-blue-500 text-white ml-auto text-right"
                : "bg-gray-300 text-black mr-auto text-left"
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "VolkAI"}:</strong> {msg.content}
          </div>
        ))}
        {loading && <p className="text-gray-500 text-center">VolkAI is typing...</p>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="mt-4 flex">
        <input
          type="text"
          className="flex-grow p-3 border rounded-l-lg focus:outline-none text-black"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className={`bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 transition ${
            loading && "opacity-50 cursor-not-allowed"
          }`}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
