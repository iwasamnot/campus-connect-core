/**
 * RAG System - Main Integration
 * Research-Grade RAG with Human-Centric AI Features
 * 
 * Priority order:
 * 1. Direct Pinecone RAG Engine (askVirtualSenior) - fastest, serverless
 * 2. Firebase Cloud Functions RAG (searchRag) - fallback
 * 3. Local in-memory retrieval - offline fallback
 * 
 * Advanced Features (13 total via askVirtualSenior):
 * 1. Semantic Guardrails - Blocks adversarial queries
 * 2. Confidence Thresholding - Admits when it doesn't know
 * 3. Conversational Memory - Resolves coreferences
 * 4. Source Citations - Cites knowledge base documents
 * 5. Metadata Filtering - Category-based search optimization
 * 6. Temporal Grounding - Time-aware responses
 * 7. Multi-Modal Support - Image analysis
 * 8. Dual-Memory Architecture - Long-term personalization
 * 9. Query Expansion (HyDE) - Semantic translation
 * 10. Admin Analytics - Pulse Dashboard
 * 11. Affective Computing - Emotional intelligence
 * 12. Socratic Tutor Mode - Pedagogical scaffolding
 * 13. Peer Discovery - Social graph / study groups
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ensureKnowledgeBaseIndexed, searchRag } from './ragClient';
import { processKnowledgeBase } from './knowledgeBaseProcessor';
import { ragRetrieval } from './ragRetrieval';
import { askVirtualSenior, checkConfiguration, getTemporalContext } from './ragEngine';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';

/**
 * Check if the direct Pinecone RAG Engine is configured
 */
const isPineconeRAGConfigured = () => {
  try {
    const config = checkConfiguration();
    return config.isConfigured;
  } catch {
    return false;
  }
};

/**
 * Initialize RAG system with knowledge base (client triggers a one-time upsert to Pinecone)
 */
export const initializeRAG = async () => {
  // Check if direct Pinecone RAG is configured
  if (isPineconeRAGConfigured()) {
    console.log('RAG: Direct Pinecone RAG Engine is configured and ready');
  }

  try {
    // Attempt to upsert the static knowledge base to Pinecone via Firebase (one-time per browser)
    await ensureKnowledgeBaseIndexed();
  } catch (error) {
    console.warn('RAG: Firebase RAG upsert skipped (will use direct Pinecone if configured)', error);
  }

  // Keep local fallback initialized for offline / failure cases
  try {
    const documents = processKnowledgeBase();
    ragRetrieval.initializeDocuments(documents);
  } catch (error) {
    console.warn('RAG: local fallback init failed', error);
  }
};

/**
 * Generate RAG-powered response
 * 
 * Priority:
 * 1. Direct Pinecone RAG Engine (askVirtualSenior) - with advanced features
 * 2. Firebase Cloud Functions RAG (searchRag) - fallback
 * 3. Local in-memory retrieval - offline fallback
 * 
 * All 13 Advanced Features (via askVirtualSenior):
 * - Safety, Confidence, Memory, Citations, Filtering, Temporal
 * - Multi-Modal, Dual-Memory, Query Expansion, Analytics
 * - Affective Computing, Socratic Mode, Peer Discovery
 * 
 * @param {string} query - The user's question
 * @param {Array} conversationHistory - Previous messages for context
 * @param {string} modelName - The Gemini model to use
 * @param {string} userContext - Additional context about the user
 * @param {string} userId - User ID for personalization (optional)
 * @param {Object} options - Additional options
 * @param {Object} options.imageData - Image data for multi-modal queries
 * @returns {Promise<Object|string>} - Response object or string
 */
export const generateRAGResponse = async (query, conversationHistory = [], modelName = 'gemini-2.5-flash', userContext = '', userId = null, options = {}) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.warn('RAG: Gemini API key not available');
    return null;
  }

  // Extract previous assistant response for conversational memory
  const previousAssistantMessages = conversationHistory.filter(msg => 
    msg.type === 'assistant' || msg.sender === 'ai' || msg.role === 'assistant'
  );
  const lastAssistantMessage = previousAssistantMessages.length > 0 
    ? previousAssistantMessages[previousAssistantMessages.length - 1]?.content || ''
    : '';

  // 1) Try Direct Pinecone RAG Engine first (Research-Grade features)
  if (isPineconeRAGConfigured()) {
    try {
      const temporal = getTemporalContext();
      console.log(`RAG: Using Human-Centric RAG Engine @ ${temporal.time}`);
      console.log('RAG: Features: Safety + Affective + Socratic + Memory + Peer Discovery + 8 more');
      
      const result = await askVirtualSenior(query, { 
        userId: userId,                          // DUAL-MEMORY: User personalization
        topK: 5,
        previousAnswer: lastAssistantMessage,    // CONVERSATIONAL MEMORY
        imageData: options.imageData || null,    // MULTI-MODAL: Image analysis
        includeDebugInfo: false,
      });
      
      // Handle blocked queries (safety filter)
      if (result.blocked) {
        console.log('RAG: 🛡️ Query blocked by safety filter');
        return { answer: result.answer, blocked: true };
      }
      
      // Handle low confidence (honesty protocol)
      if (result.lowConfidence) {
        console.log(`RAG: ⚠️ Low confidence (${(result.confidenceScore * 100).toFixed(1)}%)`);
        return { answer: result.answer, lowConfidence: true };
      }
      
      // Handle multi-modal responses
      if (result.multiModal) {
        console.log('RAG: 🖼️ Multi-modal response generated');
        return { answer: result.answer, multiModal: true };
      }
      
      if (result.answer && !result.error) {
        const category = result.queryCategory || 'general';
        const confidence = result.confidenceScore ? (result.confidenceScore * 100).toFixed(1) : 'N/A';
        const sentiment = result.sentiment || 'NEUTRAL';
        const queryType = result.queryType || 'ADMINISTRATIVE';
        const personalized = result.personalized ? '👤' : '';
        const peers = result.peerDiscovery ? `👥${result.peerDiscovery.count}` : '';
        
        console.log(`RAG: ✅ [${category}] ${sentiment} ${queryType} (${confidence}%) ${personalized} ${peers}`);
        
        // Return rich response object for UI to use
        return {
          answer: result.answer,
          metadata: {
            category,
            confidence: result.confidenceScore,
            sentiment,
            queryType,
            personalized: result.personalized,
            peerDiscovery: result.peerDiscovery,
            temporalContext: result.temporalContext,
          }
        };
      }
      console.warn('RAG: Direct Pinecone returned error, trying fallback:', result.error);
    } catch (pineconeError) {
      console.warn('RAG: Direct Pinecone RAG failed, trying Firebase fallback:', pineconeError);
    }
  }

  // 2) Try Firebase Cloud Functions RAG (fallback)
  let context = '';
  try {
    const matches = await searchRag(query, 8);
    context = formatMatches(matches, 2400);
  } catch (error) {
    console.warn('RAG: Firebase vector search failed, will use local fallback', error);
  }

  // 3) Fallback to in-memory retrieval if needed
  if (!context || context.trim().length === 0) {
    try {
      const retrievedDocs = await ragRetrieval.retrieve(query, 5, 0.2);
      context = ragRetrieval.formatContext(retrievedDocs, 2000);
    } catch (fallbackError) {
      console.warn('RAG: local retrieval failed', fallbackError);
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const historyContext = conversationHistory.length > 0
      ? `\n\n**Recent Conversation:**\n${conversationHistory.slice(-4).map(msg => 
          `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 150)}`
        ).join('\n\n')}\n\n`
      : '';
    
    const userContextSection = userContext ? `\n\n**User Context:**\n${userContext}\n` : '';
    
    const prompt = `You are an intelligent AI assistant for Sydney International School of Technology and Commerce (SISTC).

**Retrieved Knowledge Base Context:**
${context || 'No specific context retrieved. Use your general knowledge about universities and student services.'}

${historyContext}${userContextSection}
**User Question:**
${query}

**Instructions:**
- Use the retrieved context as your primary source of information for SISTC-specific questions
- If the context contains relevant information, prioritize it in your response
- Maintain continuity with the conversation history when relevant
- Use the user context to personalize your responses when appropriate
- For questions not fully covered by the context, supplement with your general knowledge
- Provide comprehensive, well-structured answers using markdown formatting
- Be helpful, empathetic, and professional
- If you don't know something, be honest and suggest where they might find more information`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('RAG: Error generating response:', error);
    return null;
  }
};

/**
 * RAG-enabled query with fallback
 */
export const queryRAG = async (query, conversationHistory = [], useRAG = true) => {
  if (useRAG) {
    const ragResponse = await generateRAGResponse(query, conversationHistory);
    if (ragResponse) {
      return ragResponse;
    }
  }
  
  // Fallback to basic retrieval if RAG fails
  const retrievedDocs = await ragRetrieval.retrieve(query, 3);
  const context = ragRetrieval.formatContext(retrievedDocs, 1000);
  
  return context || 'I apologize, but I could not retrieve relevant information for your query.';
};

/**
 * Format vector matches into a single context string
 */
const formatMatches = (matches = [], maxLength = 2400) => {
  let context = '';
  for (const match of matches) {
    const title = match.metadata?.title || match.metadata?.source || 'Context';
    const snippet = match.text || '';
    const chunk = `[${title}]\n${snippet}\n\n`;
    if (context.length + chunk.length > maxLength) break;
    context += chunk;
  }
  return context.trim();
};
