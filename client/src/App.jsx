import { useState } from "react";
import Authentification from "./pages/Authentification.jsx";
import { BrowserRouter, redirect, Route, Routes } from "react-router-dom";
import Chat from "./pages/Chat.jsx";
import { useEffect } from "react";
function App() {

  const [chat, setChat] = useState([]);
  const [chats, setChats] = useState([]);
  const [ready, setReady] = useState(false);
  const [singleChat, setSingleChat] = useState(false);
  const [messageIds, setMessageIds] = useState([]);
  const [delated, setdelated] = useState(false);
  const [delatedMessage, setDelatedMessage] = useState("");
  const [username, setUsername] = useState("");
  const [webSocket, setWebSocket] = useState(null)
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [readyMessages, setReadyMessages] = useState(false);

    useEffect(() => {
      const init = async () => {

        const ws = new WebSocket("ws://localhost:456/");
        ws.addEventListener("open", async (event) => {
          console.log("Connected to server");
  
          const sessionId = window.localStorage.getItem("session_id");
          let sessionData = {
            session_id: sessionId,
          };
  
          await sendSocketMessage(
            ws,
            "check_session|||" + JSON.stringify(sessionData)
          );
  
          if (currentChat != null) {
            let request = { chat_id: currentChat };
            await sendSocketMessage(ws, "load_chat|||" + JSON.stringify(request));
          }
          await sendSocketMessage(ws, "load_chats|||");
          setWebSocket(ws);
        });
        ws.addEventListener("close", async (event) => {
          console.log("Lost connection to server");
        });
        ws.addEventListener("error", async (event) => {
          console.error("Websocket error", event);
        });
        ws.addEventListener("message", async (event) => {
          await handleSocketMessage(event.data);
        });
        setWebSocket(ws)
      };
      init();
    }, []);

    const sendSocketMessage = async (ws, message) => {
      console.log("<< " + message);
  
      ws.send(message);
    };

    const handleSocketMessage = async (socketMessage) => {
      console.log(">> " + socketMessage);
  
      let socketContent = socketMessage.split("|||");
      let socketCommand = socketContent[0];
      let socketData = socketContent[1];
  
      if (socketCommand === "active_session") {
        let sessionData = JSON.parse(socketData);
  
        setUsername(sessionData.user.username);
      } else if (socketCommand === "session_inactive") {
        navigate("/");
      } else if (socketCommand === "chat_message_sended") {
        let messageData = JSON.parse(socketData);
  
        if (!messageIds.includes(messageData.message_id)) {
          setMessageIds([...messageIds, messageData.message_id]);
          setMessages((messages) => [...messages, messageData]);
        }
      } else if (socketCommand === "chats_loaded") {
        let chatsData = JSON.parse(socketData);
        setChats(chatsData);
        setReady(true);
      } else if (socketCommand === "chat_loaded") {
        let chat_data = JSON.parse(socketData);
        setChat(chat_data);
        setSingleChat(true);
      } else if (socketCommand === "chat_messages_loaded") {
        let messages = JSON.parse(socketData);
        setMessages(messages);
        setReadyMessages(true);
      } else if (socketCommand === "chat_message_deleted") {
        let messageDate = JSON.parse(socketData);
        setReadyMessages(false);
        setDelatedMessage(messageDate);
        setdelated(true);
      }
    };


  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Authentification />} />
          <Route path="/app" element={<Chat 
          WebSocket={webSocket}
          setWebSocket={setWebSocket}
          chat={chat}
          chats={chats}
          ready={ready}
          singleChat={singleChat}
          delated={delated}
          delatedMessage={delatedMessage}
          username={username}
          currentChat={currentChat}
          setCurrentChat={setCurrentChat}
          messages={messages}
          readyMessages={readyMessages}
          setReadyMessages={setReadyMessages}
          setMessages={setMessages}
          />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
