// Nearby Chat Component - Chat with nearby students using Bluetooth/Hotspot
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  scanNearbyDevices, 
  broadcastPresence, 
  listenForNearbyUsers,
  createNearbyConnection,
  sendNearbyMessage,
  receiveNearbyMessages,
  checkNearbyChatSupport,
  isWebBluetoothAvailable,
  isHotspotCapable,
} from '../utils/nearbyChat';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton, AnimatedModal, FadeIn, StaggerContainer, StaggerItem } from './AnimatedComponents';
import { useTheme } from '../context/ThemeContext';
import { 
  Wifi, 
  Bluetooth, 
  Users, 
  Send, 
  MessageSquare, 
  X, 
  Radio,
  Signal,
  Loader,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const NearbyChat = ({ onClose }) => {
  // If onClose is not provided, use a default handler
  const handleClose = onClose || (() => {
    // Fallback: just log
    console.log('NearbyChat closed');
  });
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const { themeStyle, darkMode } = useTheme();
  
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [supportInfo, setSupportInfo] = useState(null);
  
  const dataChannelRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const cleanupRef = useRef(null);

  // Check device support on mount
  useEffect(() => {
    const support = checkNearbyChatSupport();
    setSupportInfo(support);
    
    if (support.bluetooth || support.hotspot || support.broadcastChannel) {
      // Start broadcasting presence
      if (user) {
        broadcastPresence({
          userId: user.uid,
          name: user.displayName || user.email,
          email: user.email,
        });
      }
      
      // Start listening for nearby users
      const cleanup = listenForNearbyUsers((users) => {
        setNearbyUsers(users.filter(u => u.userId !== user?.uid));
      }, {
        timeWindow: 30000, // 30 seconds
        pollInterval: 5000, // Poll every 5 seconds
      });
      
      cleanupRef.current = cleanup;
      
      return () => {
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      };
    }
  }, [user]);

  const handleScanDevices = async () => {
    if (!isWebBluetoothAvailable()) {
      showError('Bluetooth scanning requires HTTPS and a supported browser.');
      return;
    }

    setIsScanning(true);
    try {
      const device = await scanNearbyDevices({
        acceptAllDevices: true,
      });
      
      if (device) {
        success(`Found nearby device: ${device.name}`);
      } else {
        showError('No nearby devices found');
      }
    } catch (error) {
      console.error('Error scanning devices:', error);
      showError('Failed to scan for devices. Please check Bluetooth permissions.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectToUser = async (targetUser) => {
    if (!user) return;

    try {
      setConnectionStatus('connecting');
      
      const { peerConnection, dataChannel } = await createNearbyConnection(
        targetUser.userId,
        {
          userId: user.uid,
          name: user.displayName || user.email,
        }
      );

      peerConnectionRef.current = peerConnection;
      dataChannelRef.current = dataChannel;

      // Set up message receiver
      receiveNearbyMessages(dataChannel, (message) => {
        setMessages(prev => [...prev, message]);
      });

      // Wait for data channel to open
      dataChannel.onopen = () => {
        setConnectionStatus('connected');
        setSelectedUser(targetUser);
        success(`Connected to ${targetUser.name}`);
      };

      dataChannel.onclose = () => {
        setConnectionStatus('disconnected');
        showError('Connection closed');
      };

      dataChannel.onerror = (error) => {
        setConnectionStatus('error');
        showError('Connection error occurred');
      };
    } catch (error) {
      console.error('Error connecting to user:', error);
      setConnectionStatus('error');
      showError('Failed to establish connection');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !dataChannelRef.current || !selectedUser) return;

    try {
      const message = {
        text: messageText.trim(),
        sender: {
          userId: user.uid,
          name: user.displayName || user.email,
        },
        timestamp: Date.now(),
      };

      await sendNearbyMessage(dataChannelRef.current, message);
      
      // Add to local messages
      setMessages(prev => [...prev, { ...message, sent: true }]);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message');
    }
  };

  const handleDisconnect = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    setConnectionStatus('disconnected');
    setSelectedUser(null);
    setMessages([]);
  };

  return (
    <AnimatedModal isOpen={true} onClose={handleClose} className="p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel border border-white/10 rounded-[2rem] p-6 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 glass-panel bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
              <Radio className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white text-glow">
                Nearby Chat
              </h2>
              <p className="text-xs text-white/60">
                Connect with students nearby
              </p>
            </div>
          </div>
          <motion.button
            onClick={handleClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 glass-panel border border-white/10 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Support Info */}
        {supportInfo && (
          <div className="mb-4 p-3 glass-panel bg-blue-600/10 border border-blue-500/30 rounded-xl text-xs">
            <div className="flex items-center gap-2 mb-2">
              <Signal className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-blue-300">Device Support:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-blue-200">
              <div className="flex items-center gap-1">
                {supportInfo.bluetooth ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>Bluetooth</span>
              </div>
              <div className="flex items-center gap-1">
                {supportInfo.hotspot ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>Hotspot</span>
              </div>
              <div className="flex items-center gap-1">
                {supportInfo.broadcastChannel ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>Broadcast</span>
              </div>
              <div className="flex items-center gap-1">
                {supportInfo.webrtc ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span>P2P Chat</span>
              </div>
            </div>
          </div>
        )}

        {selectedUser ? (
          // Chat Interface
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  {selectedUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white/20 ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-white/60">
                  {connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </p>
              </div>
              <motion.button
                onClick={handleDisconnect}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 glass-panel border border-white/10 rounded-xl hover:border-white/20 text-sm text-white/70 hover:text-white transition-all"
              >
                Disconnect
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[400px]">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/40 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender?.userId === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.sender?.userId === user?.uid
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/10 text-white'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender?.userId === user?.uid
                          ? 'text-indigo-100'
                          : 'text-white/60'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Message Input */}
            {connectionStatus === 'connected' && (
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
                />
                <AnimatedButton
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  variant="default"
                  className="px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </AnimatedButton>
              </div>
            )}
          </div>
        ) : (
          // User List / Scan Interface
          <div className="flex-1 flex flex-col min-h-0">
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <AnimatedButton
                onClick={handleScanDevices}
                disabled={isScanning || !isWebBluetoothAvailable()}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4" />
                    <span>Scan Bluetooth</span>
                  </>
                )}
              </AnimatedButton>
              
              {isHotspotCapable() && (
                <AnimatedButton
                  onClick={() => {
                    // Hotspot detection is passive - already running
                    success('Hotspot detection is active. Nearby users on the same network will appear automatically.');
                  }}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Wifi className="w-4 h-4" />
                  <span>Hotspot</span>
                </AnimatedButton>
              )}
            </div>

            {/* Nearby Users List */}
            <div className="flex-1 overflow-y-auto">
              {nearbyUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 glass-panel bg-white/10 border border-white/10 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white/40" />
                  </div>
                  <p className="text-white/60 mb-2 font-medium">
                    No nearby students found
                  </p>
                  <p className="text-xs text-white/50 max-w-xs">
                    Make sure you're on the same WiFi network or hotspot, or enable Bluetooth scanning.
                  </p>
                </div>
              ) : (
                <StaggerContainer className="space-y-2">
                  {nearbyUsers.map((nearbyUser, index) => (
                    <StaggerItem key={nearbyUser.userId || index} delay={index * 0.05}>
                      <motion.button
                        onClick={() => handleConnectToUser(nearbyUser)}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-3 p-3 glass-panel border border-white/10 hover:border-white/20 rounded-xl transition-all"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                          {nearbyUser.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-white truncate">
                            {nearbyUser.name || 'Unknown User'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-white/60 truncate">
                              {nearbyUser.email}
                            </p>
                            {nearbyUser.distance && (
                              <span className="text-xs px-2 py-0.5 glass-panel bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-full font-medium">
                                {nearbyUser.distance}
                              </span>
                            )}
                          </div>
                        </div>
                        <MessageSquare className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                      </motion.button>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatedModal>
  );
};

export default NearbyChat;
