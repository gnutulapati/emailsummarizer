import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [emails, setEmails] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const websocket = new WebSocket("ws://localhost:8000/ws");
    setWs(websocket);

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "email_update") {
        setEmails(data.data);
      } else if (data.type === "notification") {
        setNotifications((prev) => [...prev, ...data.data]);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      websocket.close();
    };
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3:
        return "bg-red-100 border-red-500";
      case 2:
        return "bg-yellow-100 border-yellow-500";
      default:
        return "bg-green-100 border-green-500";
    }
  };

  const fetchFullEmail = async (emailId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/emails/${emailId}`);
      const fullEmail = await response.json();
      setSelectedEmail(fullEmail);
    } catch (error) {
      console.error("Error fetching full email:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-blue-500"
            >
              <p className="font-semibold">{notification.title}</p>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-10 text-center text-white">
        <h1 className="text-5xl font-extrabold mb-8 tracking-wide font-[Poppins]">
          Email Summarizer
        </h1>

        {/* Email List */}
        <div className="grid gap-4">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`p-5 rounded-xl shadow-lg border-l-4 ${getPriorityColor(
                email.priority
              )} bg-gray-800 bg-opacity-70 backdrop-blur-md hover:bg-gray-700 transition-all duration-300 card-hover`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{email.subject}</h2>
                  <p className="text-sm text-gray-600">{email.sender}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(email.date).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!email.is_full && (
                    <button
                      onClick={() => fetchFullEmail(email.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "View Full Email"}
                    </button>
                  )}
                  <a
                    href={email.original_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    View in Gmail
                  </a>
                </div>
              </div>

              {email.is_full && (
                <>
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Summary:</h3>
                    <p className="text-gray-700">{email.summary}</p>
                  </div>

                  {email.events && email.events.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Events:</h3>
                      <ul className="list-disc pl-5">
                        {email.events.map((event, index) => (
                          <li key={index} className="text-gray-700">
                            {event.description} -{" "}
                            {new Date(event.date).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Full Email Modal */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold">
                  {selectedEmail.subject}
                </h2>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-600">From: {selectedEmail.sender}</p>
                <p className="text-gray-500">
                  Date: {new Date(selectedEmail.date).toLocaleString()}
                </p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Summary:</h3>
                <p className="text-gray-700">{selectedEmail.summary}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Full Content:</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {selectedEmail.body}
                  </pre>
                </div>
              </div>
              {selectedEmail.events && selectedEmail.events.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Events:</h3>
                  <ul className="list-disc pl-5">
                    {selectedEmail.events.map((event, index) => (
                      <li key={index} className="text-gray-700">
                        {event.description} -{" "}
                        {new Date(event.date).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
