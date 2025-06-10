"use client";

import { useSocket } from "@/hooks/useSocket";
import { useState, useEffect, useContext } from "react";
import { useUser } from "@account-kit/react";
import { Context } from "@/context/contextProvider";

const GlobalChat = () => {
  const { isConnected, sendMessage, subscribeToEvent } = useSocket();
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const user = useUser();
  const { userDetails } = useContext(Context);

  useEffect(() => {
    // Auto-join chat if user is authenticated
    if (isConnected && user && !isJoined && userDetails?.username) {
      handleJoin();
    }
  }, [isConnected, user, userDetails, isJoined]);

  useEffect(() => {
    if (isConnected) {
      // Subscribe to server messages
      const unsubscribeMessage = subscribeToEvent("message", (message: string) => {
        setMessages((prev) => [...prev, `Server: ${message}`]);
      });

      // Subscribe to chat messages
      const unsubscribeChat = subscribeToEvent("chat:message", (data: any) => {
        setMessages((prev) => [
          ...prev,
          `${data.username}: ${data.text} (${new Date(data.timestamp).toLocaleTimeString()})`,
        ]);
      });

      // Subscribe to user updates (join/leave)
      const unsubscribeUsers = subscribeToEvent("users:update", (users: any[]) => {
        console.log("Active users:", users);
      });

      return () => {
        unsubscribeMessage();
        unsubscribeChat();
        unsubscribeUsers();
      };
    }
  }, [isConnected, subscribeToEvent]);

  const handleJoin = () => {
    if (userDetails?.username) {
      sendMessage("user:join", { 
        name: userDetails.username,
        id: userDetails._id,
        wallet: user?.address
      });
      setIsJoined(true);
      setMessages((prev) => [...prev, `You joined as ${userDetails.username}`]);
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && isJoined && userDetails?.username) {
      sendMessage("chat:message", {
        text: inputMessage,
        username: userDetails.username,
        userId: userDetails._id,
        wallet: user?.address
      });
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded-lg shadow-lg bg-[#141e29] border-[#1783fb]">
      <h2 className="text-xl font-bold mb-4 text-[#1783fb]">Global Chat</h2>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      {!user || !userDetails?.username ? (
        <div className="mb-4 text-center p-4 bg-gray-800 rounded">
          <p className="mb-2">Please login to join the chat</p>
        </div>
      ) : !isJoined ? (
        <div className="mb-4 text-center">
          <button
            onClick={handleJoin}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-700"
          >
            Join Chat as {userDetails.username}
          </button>
        </div>
      ) : (
        <>
          <div className="h-64 overflow-y-auto border border-[#1783fb] rounded p-2 mb-4 bg-[#0F345C]/30">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className="mb-1">
                  {msg}
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center mt-4">
                No messages yet. Start the conversation!
              </div>
            )}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message"
              className="flex-1 p-2 border rounded-l bg-[#0F345C]/50 border-[#1783fb] focus:outline-none text-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={!isConnected || !inputMessage.trim()}
              className="px-4 py-2 bg-[#1783fb] text-white rounded-r disabled:bg-gray-700"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalChat; 