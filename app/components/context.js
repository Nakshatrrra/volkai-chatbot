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

  const handleStream = async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Initialize an empty assistant message
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Process the chunk
        const chunk = decoder.decode(value);
        const events = chunk
          .split("\n\n")
          .filter(line => line.trim() !== "")
          .map(line => line.replace("data: ", ""));

        // Process each event
        for (const eventText of events) {
          try {
            const event = JSON.parse(eventText);
            
            if (event.type === "token") {
              // Update message content token by token
              setMessages(prevMessages => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                const updatedMessages = [...prevMessages.slice(0, -1)];
                updatedMessages.push({
                  ...lastMessage,
                  content: lastMessage.content + event.content
                });
                return updatedMessages;
              });
              
              // Let the UI update before processing next token
              await new Promise(resolve => setTimeout(resolve, 0));
            }
          } catch (error) {
            console.error("Error parsing event:", error);
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Create system message with context from previous conversation if it exists
      let systemMessage = null;
      if (messages.length >= 2) {
        // Get the last user question and model response
        const lastUserIndex = messages.map(m => m.role).lastIndexOf("user");
        if (lastUserIndex !== -1 && lastUserIndex < messages.length - 1) {
          const lastUserQuestion = messages[lastUserIndex].content;
          const lastModelResponse = messages[lastUserIndex + 1].content;
          
          systemMessage = {
            role: "system",
            content: `### Human: ${lastUserQuestion} ### Assistant: ${lastModelResponse}`
          };
        }
      }

      // Build the messages array for the API call
      const apiMessages = systemMessage 
        ? [systemMessage, userMessage] 
        : [userMessage];

      const response = await fetch("https://dhaara.io/generate_stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
          max_tokens: maxTokens,
          temperature: 0.5,
          top_p: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await handleStream(response);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
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
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;