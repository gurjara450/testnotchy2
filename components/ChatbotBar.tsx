import { useState } from 'react';

export default function ChatbotBar() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message to the chat
    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    // Fetch AI response
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();

      // Add AI response to the chat
      setMessages([...newMessages, { sender: 'bot', text: data.reply }]);
    } catch {
      setMessages([...newMessages, { sender: 'bot', text: 'Error: Unable to fetch response.' }]);
    }
  };

  return (
    <div className="fixed bottom-0 w-full bg-gray-900 text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow p-2 rounded-lg bg-gray-800 focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
      <div className="max-w-4xl mx-auto mt-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${
              msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}