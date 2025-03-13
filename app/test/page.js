"use client";

import { useState, useRef, useEffect } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN;
    try {
      const response = await fetch("https://sido1o6oi7wffwlu.us-east-1.aws.endpoints.huggingface.cloud", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HF_TOKEN}`
        },
        body: JSON.stringify({
          inputs: `### Context: You're Volkai, Created by Kairosoft AI Solutions Limited. \n\n### Human: ${input}\n\n### Assistant: `,
          parameters: {
            temperature: 0.5,
            max_new_tokens: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data[0]?.generated_text || "No response received";
  
      // Extract only the first human response
      const humanResponses = generatedText.match(/### Assistant: (.*?)\n/g);
      const firstHumanResponse = humanResponses ? humanResponses[0].replace("### Assistant: ", "").trim() : "No response";
  
      setMessages((prev) => [...prev, { role: "assistant", content: firstHumanResponse }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error processing request." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg border text-black">
      <h2 className="text-2xl font-bold text-black mb-4">Chat with VolkAI</h2>

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
            <strong>{msg.role === "user" ? "You" : "VolkAI"}:</strong> {msg.content}
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
          className={`px-6 py-3 bg-blue-600 text-white rounded-r-lg transition-colors ${
            isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
