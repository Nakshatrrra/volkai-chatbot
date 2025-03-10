"use client";

import { useState, useRef, useEffect } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [maxTokens, setMaxTokens] = useState(100);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Send only the latest message instead of the full conversation history
      const payload = {
        messages: [userMessage],
        max_tokens: maxTokens,
        temperature: 0.5,
      };

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const response = await fetch("https://dhaara.io/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setMessages(prevMessages => {
        const lastMessage = { role: "assistant", content: data.generated_text };
        return [...prevMessages.slice(0, -1), lastMessage];
      });
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

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
            {Array.from({ length: 20 }, (_, i) => (i + 1) * 50).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-[500px] overflow-y-auto bg-gray-100 p-3 rounded-lg border">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 my-2 rounded-lg ${
              msg.role === "user"
                ? "bg-blue-500 text-white ml-auto max-w-[80%] text-right"
                : "bg-gray-300 text-black mr-auto max-w-[80%] whitespace-pre-wrap"
            }`}
          >
            <strong>{msg.role === "user" ? "You" : "VolkAI"}:</strong>{" "}
            <span>{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex">
        <input
          type="text"
          className="flex-grow p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={isGenerating}
        />
        <button
          onClick={sendMessage}
          disabled={isGenerating}
          className={`px-6 py-3 bg-blue-600 text-white rounded-r-lg transition-colors
            ${isGenerating 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:bg-blue-700 active:bg-blue-800"
            }`}
        >
          {isGenerating ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;