/**
 * Tool Registry - Executable functions for ReAct Agent
 * Tools that the AI can call autonomously to perform actions
 */

import { ragRetrieval } from './ragRetrieval';

/**
 * Tool: Check availability of resources (rooms, equipment, etc.)
 * @param {string} resourceType - Type of resource ('room', 'equipment', 'lab')
 * @param {string} [date] - Optional date filter (ISO format)
 * @returns {Promise<Object>} - Availability information
 */
export const checkAvailability = async (resourceType, date = null) => {
  // Mock implementation - in production, this would query a real booking system
  const mockAvailabilities = {
    room: [
      { id: 'room-302', name: 'Room 302', available: true, timeSlots: ['09:00-11:00', '14:00-16:00'] },
      { id: 'room-305', name: 'Room 305', available: true, timeSlots: ['10:00-12:00', '15:00-17:00'] },
      { id: 'room-310', name: 'Room 310', available: false, reason: 'Booked until 3 PM' }
    ],
    equipment: [
      { id: 'laptop-01', name: 'Laptop 01', available: true },
      { id: 'projector-01', name: 'Projector 01', available: true },
      { id: 'camera-01', name: 'Camera 01', available: false, reason: 'In use' }
    ],
    lab: [
      { id: 'lab-a', name: 'Computer Lab A', available: true, capacity: 30 },
      { id: 'lab-b', name: 'Computer Lab B', available: false, reason: 'Maintenance' }
    ]
  };

  // Simulate async delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const results = mockAvailabilities[resourceType] || [];
  
  console.log(`🔧 [Tool] checkAvailability(${resourceType}${date ? `, ${date}` : ''}) → ${results.length} results`);
  
  return {
    success: true,
    resourceType,
    date,
    results,
    timestamp: new Date().toISOString()
  };
};

/**
 * Tool: Book a resource
 * @param {string} resourceId - ID of the resource to book
 * @param {string} time - Time slot (e.g., '09:00-11:00' or ISO datetime)
 * @param {string} [purpose] - Optional purpose/reason for booking
 * @returns {Promise<Object>} - Booking confirmation
 */
export const bookResource = async (resourceId, time, purpose = 'General use') => {
  // Mock implementation - in production, this would create a real booking
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log(`🔧 [Tool] bookResource(${resourceId}, ${time}, ${purpose}) → Success`);
  
  return {
    success: true,
    bookingId: `booking-${Date.now()}`,
    resourceId,
    time,
    purpose,
    status: 'confirmed',
    message: `Successfully booked ${resourceId} for ${time}`,
    timestamp: new Date().toISOString()
  };
};

/**
 * Tool: Search library/knowledge base using Pinecone
 * @param {string} query - Search query
 * @param {number} [topK=5] - Number of results to return
 * @returns {Promise<Object>} - Search results
 */
export const searchLibrary = async (query, topK = 5) => {
  try {
    console.log(`🔧 [Tool] searchLibrary("${query}", topK=${topK})`);
    
    // Use existing RAG retrieval system
    const retrievedDocs = await ragRetrieval.retrieve(query, topK, 0.01);
    
    if (retrievedDocs.length === 0) {
      return {
        success: true,
        query,
        results: [],
        message: 'No relevant documents found in the knowledge base.',
        timestamp: new Date().toISOString()
      };
    }

    // Format results
    const results = retrievedDocs.map((doc, index) => ({
      rank: index + 1,
      title: doc.title || doc.id || 'Untitled',
      content: doc.content?.substring(0, 300) || doc.text?.substring(0, 300) || '',
      score: doc.score || 0,
      source: doc.source || 'knowledge_base'
    }));

    console.log(`🔧 [Tool] searchLibrary → ${results.length} results found`);
    
    return {
      success: true,
      query,
      results,
      count: results.length,
      message: `Found ${results.length} relevant document(s) in the knowledge base.`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('🔧 [Tool] searchLibrary error:', error);
    return {
      success: false,
      query,
      results: [],
      error: error.message || 'Failed to search library',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Tool: Get current date and time
 * @returns {Object} - Current date/time information
 */
export const getCurrentDateTime = () => {
  const now = new Date();
  return {
    success: true,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0],
    datetime: now.toISOString(),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    timestamp: now.toISOString()
  };
};

/**
 * Tool registry - maps tool names to functions
 */
export const TOOL_REGISTRY = {
  checkAvailability: {
    name: 'checkAvailability',
    description: 'Check availability of resources (rooms, equipment, labs). Returns available time slots and status.',
    parameters: {
      resourceType: { type: 'string', required: true, description: 'Type of resource: "room", "equipment", or "lab"' },
      date: { type: 'string', required: false, description: 'Optional date filter (ISO format: YYYY-MM-DD)' }
    },
    execute: checkAvailability,
    requiresHumanApproval: false
  },
  bookResource: {
    name: 'bookResource',
    description: 'Book a resource (room, equipment, lab) for a specific time slot.',
    parameters: {
      resourceId: { type: 'string', required: true, description: 'ID of the resource to book (e.g., "room-302")' },
      time: { type: 'string', required: true, description: 'Time slot (e.g., "09:00-11:00" or ISO datetime)' },
      purpose: { type: 'string', required: false, description: 'Purpose/reason for booking' }
    },
    execute: bookResource,
    requiresHumanApproval: true // Sensitive action - requires human approval
  },
  searchLibrary: {
    name: 'searchLibrary',
    description: 'Search the knowledge base/library for information using semantic search.',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query' },
      topK: { type: 'number', required: false, description: 'Number of results (default: 5)' }
    },
    execute: searchLibrary,
    requiresHumanApproval: false
  },
  getCurrentDateTime: {
    name: 'getCurrentDateTime',
    description: 'Get the current date and time information.',
    parameters: {},
    execute: getCurrentDateTime,
    requiresHumanApproval: false
  }
};

/**
 * Get tool schema for LLM
 * @returns {string} - Formatted tool descriptions for system prompt
 */
export const getToolSchemas = () => {
  return Object.values(TOOL_REGISTRY).map(tool => {
    const params = Object.entries(tool.parameters || {}).map(([name, param]) => {
      return `  - ${name} (${param.type}${param.required ? ', required' : ', optional'}): ${param.description}`;
    }).join('\n');
    
    return `${tool.name}: ${tool.description}
Parameters:
${params || '  (none)'}
${tool.requiresHumanApproval ? '⚠️ Requires human approval' : ''}`;
  }).join('\n\n');
};
