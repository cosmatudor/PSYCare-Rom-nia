import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: string;
}

interface Conversation {
  userId: string;
  messages: Message[];
  unreadCount: number;
}

interface Patient {
  id: string;
  name: string;
}

export default function PsychologistMessages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    loadPatients();
  }, []);

  // Check for userId in URL query params
  useEffect(() => {
    const userIdFromUrl = searchParams.get('userId');
    if (userIdFromUrl) {
      setSelectedUserId(userIdFromUrl);
      // Remove query param after setting it
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
      
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedUserId);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  const loadConversations = async () => {
    try {
      const response = await axios.get('/api/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await axios.get('/api/patients/my-patients');
      const patientsMap: Record<string, Patient> = {};
      response.data.forEach((p: Patient) => {
        patientsMap[p.id] = p;
      });
      setPatients(patientsMap);
    } catch (error) {
      console.error('Failed to load patients', error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const response = await axios.get(`/api/messages/${userId}`);
      setMessages(response.data);
      await loadConversations();
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newMessage.trim()) return;

    try {
      await axios.post('/api/messages', {
        toId: selectedUserId,
        text: newMessage
      });
      setNewMessage('');
      await loadMessages(selectedUserId);
    } catch (error) {
      alert('Eroare la trimiterea mesajului');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mesaje</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Conversații</h2>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {conversations.length === 0 && Object.keys(patients).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nu ai conversații
              </div>
            ) : (
              <>
                {/* Existing conversations */}
                {conversations.map(conv => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUserId(conv.userId)}
                    className={`w-full p-4 text-left hover:bg-gray-50 ${
                      selectedUserId === conv.userId ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {patients[conv.userId]?.name || 'Pacient'}
                        </p>
                        {conv.messages.length > 0 && (
                          <p className="text-sm text-gray-600 truncate max-w-[200px]">
                            {conv.messages[conv.messages.length - 1].text}
                          </p>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                
                {/* Patients without conversations */}
                {Object.values(patients)
                  .filter(patient => !conversations.some(conv => conv.userId === patient.id))
                  .map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedUserId(patient.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 ${
                        selectedUserId === patient.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-500">Nicio conversație încă</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
          {selectedUserId ? (
            <>
              <div className="p-4 border-b">
                <h2 className="font-semibold">
                  {patients[selectedUserId]?.name || 'Pacient'}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Nu există mesaje încă
                  </div>
                ) : (
                  messages.map(msg => {
                    const isFromMe = msg.fromId === user?.id;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isFromMe
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <p className={`text-xs mt-1 ${
                            isFromMe ? 'text-primary-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString('ro-RO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Scrie un mesaj..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
                  >
                    Trimite
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selectează o conversație
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

