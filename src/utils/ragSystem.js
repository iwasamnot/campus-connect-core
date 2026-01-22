/**
 * RAG System - Main Integration
 * Combines retrieval and generation for RAG-powered responses
 * Updated for Vertex AI enterprise tier with increased context density
 */

import { ragRetrieval } from './ragRetrieval';
import { processKnowledgeBase } from './knowledgeBaseProcessor';
import { callAI, getAIProvider } from './aiProvider';

// Determine which provider is being used
const getProviderName = () => {
  const config = getAIProvider();
  return config?.provider || 'unknown';
};

/**
 * Initialize RAG system with knowledge base
 */
export const initializeRAG = async () => {
  try {
    // Try to load from Firestore
    await ragRetrieval.loadDocuments();
    
    // If no documents loaded, process knowledge base
    if (ragRetrieval.documents.length === 0) {
      const documents = processKnowledgeBase();
      ragRetrieval.initializeDocuments(documents);
      console.log(`RAG: Initialized with ${documents.length} knowledge base documents`);
    }
  } catch (error) {
    console.error('RAG: Error initializing:', error);
    // Fallback: Use processed knowledge base
    const documents = processKnowledgeBase();
    ragRetrieval.initializeDocuments(documents);
  }
};

/**
 * Generate RAG-powered response
 * Updated for Vertex AI with increased topK (3 -> 10) for better context
 */
export const generateRAGResponse = async (query, conversationHistory = [], modelName = 'gemini-1.5-flash', userContext = '') => {
  const provider = getProviderName();
  const providerDisplay = provider === 'vertex-ai' ? 'Vertex AI' : provider === 'unknown' ? 'Offline Fallback' : 'Gemini API';
  
  console.log(`🔍 RAG: Using provider: ${providerDisplay} for query: "${query.substring(0, 50)}..."`);

  try {
    // Retrieve relevant documents - INCREASED from 3 to 10 for better context density
    const retrievedDocs = await ragRetrieval.retrieve(query, 10, 0.2);
    
    // Format context from retrieved documents - all 10 results joined cleanly
    const context = ragRetrieval.formatContext(retrievedDocs, 3000); // Increased max length for more context
    
    // Build conversation history
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

    // Use the unified AI provider system (supports Vertex AI, Gemini, and fallbacks)
    const response = await callAI(prompt, {
      systemPrompt: 'You are an intelligent AI assistant for SISTC. Provide accurate, helpful information based on the retrieved context.',
      maxTokens: 2048,
      temperature: 0.7
    });

    console.log(`✅ RAG: Response generated successfully using ${providerDisplay}`);
    return response;
  } catch (error) {
    console.error(`❌ RAG: Error generating response with ${providerDisplay}:`, error);
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

