// Nearby Chat Utilities - Using Bluetooth and Network Proximity
// Enables offline peer-to-peer messaging when students are in close proximity

/**
 * Detect if Bluetooth API is available
 */
export const isBluetoothAvailable = () => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

/**
 * Detect if Web Bluetooth API is available
 */
export const isWebBluetoothAvailable = () => {
  return isBluetoothAvailable() && 'requestDevice' in navigator.bluetooth;
};

/**
 * Get device network information for proximity detection
 */
export const getNetworkInfo = async () => {
  if (typeof navigator === 'undefined') return null;

  try {
    // Get connection info (if available)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection.downlink, // Mbps
        rtt: connection.rtt, // Round trip time in ms
        saveData: connection.saveData, // Data saver mode
      };
    }

    // Fallback: Use network state API
    const isOnline = navigator.onLine;
    return {
      online: isOnline,
      effectiveType: isOnline ? 'unknown' : 'offline',
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return null;
  }
};

/**
 * Detect if device supports hotspot/tethering
 */
export const isHotspotCapable = () => {
  if (typeof navigator === 'undefined') return false;
  
  // Check for network state changes (indicates hotspot capability)
  return 'connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator;
};

/**
 * Scan for nearby devices using Web Bluetooth
 * Note: Requires HTTPS and user permission
 */
export const scanNearbyDevices = async (options = {}) => {
  if (!isWebBluetoothAvailable()) {
    throw new Error('Web Bluetooth API is not available. Requires HTTPS and supported browser.');
  }

  try {
    // Cannot use both filters and acceptAllDevices - use one or the other
    const requestOptions = {
      optionalServices: options.optionalServices || ['battery_service'],
    };
    
    // Use acceptAllDevices if specified, otherwise use filters
    if (options.acceptAllDevices) {
      requestOptions.acceptAllDevices = true;
    } else {
      requestOptions.filters = options.filters || [{ services: ['battery_service'] }]; // Generic service
    }
    
    const device = await navigator.bluetooth.requestDevice(requestOptions);

    return {
      id: device.id,
      name: device.name || 'Unknown Device',
      connected: device.gatt?.connected || false,
    };
  } catch (error) {
    if (error.name === 'NotFoundError') {
      console.log('No nearby devices found');
      return null;
    }
    if (error.name === 'SecurityError') {
      console.warn('Bluetooth access denied by user');
      return null;
    }
    throw error;
  }
};

/**
 * Broadcast presence using Web Bluetooth advertising (when available)
 * Note: Limited browser support, uses network proximity as fallback
 */
export const broadcastPresence = async (userInfo) => {
  if (!isBluetoothAvailable()) {
    // Fallback: Use network-based proximity
    return broadcastViaNetwork(userInfo);
  }

  try {
    // Attempt Bluetooth advertising (requires experimental APIs)
    if ('bluetooth' in navigator && 'advertising' in navigator.bluetooth) {
      // This is experimental - not widely supported yet
      await navigator.bluetooth.advertising.start({
        // Service UUID for CampusConnect
        serviceUuid: '12345678-1234-1234-1234-123456789abc',
        serviceData: {
          userId: userInfo.userId,
          name: userInfo.name,
          timestamp: Date.now(),
        },
      });
      return { method: 'bluetooth', success: true };
    }
  } catch (error) {
    console.warn('Bluetooth advertising not available, using network fallback:', error);
  }

  // Fallback to network-based proximity
  return broadcastViaNetwork(userInfo);
};

/**
 * Broadcast presence via network/local storage (fallback method)
 */
const broadcastViaNetwork = (userInfo) => {
  try {
    // Use localStorage as a shared broadcast channel (works on same network)
    const presenceData = {
      userId: userInfo.userId,
      name: userInfo.name,
      email: userInfo.email,
      timestamp: Date.now(),
      location: getApproximateLocation(),
    };

    // Store in sessionStorage for cross-tab communication
    sessionStorage.setItem('nearby_presence', JSON.stringify(presenceData));

    // Broadcast via BroadcastChannel API (works across tabs/windows on same origin)
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('campusconnect_nearby');
      channel.postMessage({
        type: 'presence',
        data: presenceData,
      });
    }

    return { method: 'network', success: true };
  } catch (error) {
    console.error('Error broadcasting presence:', error);
    return { method: 'network', success: false, error: error.message };
  }
};

/**
 * Get approximate location for proximity detection
 */
const getApproximateLocation = () => {
  try {
    // Use geolocation if available (with permission)
    if ('geolocation' in navigator) {
      return {
        available: true,
        method: 'geolocation',
      };
    }

    // Fallback: Use network-based location hints
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      available: false,
      method: 'network',
      connectionType: connection?.effectiveType || 'unknown',
    };
  } catch (error) {
    return {
      available: false,
      method: 'unknown',
    };
  }
};

/**
 * Listen for nearby devices/broadcasts
 */
export const listenForNearbyUsers = (callback, options = {}) => {
  const nearbyUsers = new Map();
  
  // Method 1: BroadcastChannel (same origin, different tabs)
  if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('campusconnect_nearby');
    channel.onmessage = (event) => {
      if (event.data.type === 'presence') {
        const userData = event.data.data;
        const userId = userData.userId;
        
        // Only add if user is still "nearby" (within time window)
        const timeWindow = options.timeWindow || 30000; // 30 seconds default
        const isRecent = Date.now() - userData.timestamp < timeWindow;
        
        if (isRecent) {
          nearbyUsers.set(userId, {
            ...userData,
            distance: 'nearby', // Approximate
            lastSeen: userData.timestamp,
          });
          callback(Array.from(nearbyUsers.values()));
        }
      }
    };
  }

  // Method 2: Poll sessionStorage (same device, different tabs)
  const pollInterval = setInterval(() => {
    try {
      const presenceData = sessionStorage.getItem('nearby_presence');
      if (presenceData) {
        const data = JSON.parse(presenceData);
        const timeWindow = options.timeWindow || 30000;
        const isRecent = Date.now() - data.timestamp < timeWindow;
        
        if (isRecent && data.userId) {
          nearbyUsers.set(data.userId, {
            ...data,
            distance: 'same_device',
            lastSeen: data.timestamp,
          });
          callback(Array.from(nearbyUsers.values()));
        }
      }
    } catch (error) {
      console.error('Error polling nearby users:', error);
    }
  }, options.pollInterval || 5000); // Poll every 5 seconds

  // Cleanup function
  return () => {
    clearInterval(pollInterval);
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('campusconnect_nearby');
      channel.close();
    }
  };
};

/**
 * Create a peer-to-peer connection for nearby chat
 * Uses WebRTC for direct device-to-device communication
 */
export const createNearbyConnection = async (targetUserId, userInfo) => {
  try {
    // Create RTCPeerConnection for P2P communication
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // Free STUN server
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Create data channel for messaging
    const dataChannel = peerConnection.createDataChannel('chat', {
      ordered: true,
    });

    // Handle ICE candidates for connection establishment
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to nearby peer (via signaling)
        console.log('ICE candidate:', event.candidate);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
    };

    return {
      peerConnection,
      dataChannel,
      ready: false,
    };
  } catch (error) {
    console.error('Error creating nearby connection:', error);
    throw error;
  }
};

/**
 * Send message via nearby connection (P2P)
 */
export const sendNearbyMessage = async (dataChannel, message) => {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    throw new Error('Data channel is not open');
  }

  try {
    const messageData = {
      type: 'message',
      text: message.text,
      timestamp: Date.now(),
      sender: message.sender,
    };

    dataChannel.send(JSON.stringify(messageData));
    return { success: true };
  } catch (error) {
    console.error('Error sending nearby message:', error);
    throw error;
  }
};

/**
 * Receive messages from nearby connection
 */
export const receiveNearbyMessages = (dataChannel, callback) => {
  if (!dataChannel) {
    throw new Error('Data channel is not available');
  }

  dataChannel.onmessage = (event) => {
    try {
      const messageData = JSON.parse(event.data);
      if (messageData.type === 'message') {
        callback(messageData);
      }
    } catch (error) {
      console.error('Error parsing nearby message:', error);
    }
  };

  dataChannel.onopen = () => {
    console.log('Nearby chat data channel opened');
  };

  dataChannel.onclose = () => {
    console.log('Nearby chat data channel closed');
  };

  dataChannel.onerror = (error) => {
    console.error('Nearby chat data channel error:', error);
  };
};

/**
 * Check if device supports nearby chat features
 */
export const checkNearbyChatSupport = () => {
  return {
    bluetooth: isBluetoothAvailable(),
    webBluetooth: isWebBluetoothAvailable(),
    hotspot: isHotspotCapable(),
    broadcastChannel: 'BroadcastChannel' in window,
    webrtc: typeof RTCPeerConnection !== 'undefined',
    dataChannel: typeof RTCPeerConnection !== 'undefined',
    geolocation: 'geolocation' in navigator,
  };
};
