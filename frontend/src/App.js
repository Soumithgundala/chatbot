import React, { useState, useEffect, useRef } from 'react';

const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatWindowRef = useRef(null);

    const backendUrl = 'http://localhost:5001/api/chat';

    // Scroll to the bottom of the chat window when new messages are added
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    // Add initial welcome message
    useEffect(() => {
        setMessages([{
            text: "Hello! I'm your friendly e-commerce assistant. How can I help you today?",
            sender: 'bot'
        }]);
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const botMessage = { text: data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Failed to fetch from backend:", error);
            const errorMessage = { text: "Oops! Something went wrong. Please try again.", sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFAQClick = (question) => {
        setInput(question);
        // We can't directly call handleSendMessage here because the state update of `input` is async.
        // So we manually trigger the process.
        const userMessage = { text: question, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: question }),
        })
        .then(res => res.json())
        .then(data => {
            const botMessage = { text: data.response, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
        })
        .catch(error => {
             const errorMessage = { text: "Oops! Something went wrong. Please try again.", sender: 'bot' };
             setMessages(prev => [...prev, errorMessage]);
        })
        .finally(() => {
            setIsLoading(false);
            setInput('');
        });
    };

    return (
        <div className="bg-gray-100 font-sans flex items-center justify-center h-screen">
            <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col h-[95vh] my-auto">
                {/* Header */}
                <div className="bg-blue-600 text-white p-5 rounded-t-2xl flex items-center justify-between shadow-md">
                    <h1 className="text-xl font-bold">E-commerce Support Bot</h1>
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>

                {/* Chat Window */}
                <div ref={chatWindowRef} className="flex-1 p-6 overflow-y-auto space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">B</div>
                            )}
                            <div className={`p-4 rounded-lg max-w-lg whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}`}>
                                <p>{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center text-xl font-bold">U</div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">B</div>
                            <div className="p-4 rounded-lg max-w-lg bg-gray-200 text-gray-800 rounded-tl-none">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Input Area */}
                <div className="p-6 bg-white border-t border-gray-200 rounded-b-2xl">
                     <div className="flex gap-2 mb-4 flex-wrap">
                        <button onClick={() => handleFAQClick('Top 5 most selling products')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-4 rounded-full transition duration-300">Top 5 Selling Products</button>
                        <button onClick={() => handleFAQClick('status of order id: 8')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-4 rounded-full transition duration-300">Status for Order 8</button>
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading} className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out disabled:bg-blue-300">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default App;
