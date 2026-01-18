/**
 * RAG System - Main Integration
 * Combines retrieval and generation for RAG-powered responses
 */

import { ragRetrieval } from './ragRetrieval';
import { processKnowledgeBase } from './knowledgeBaseProcessor';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';

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
 */
export const generateRAGResponse = async (query, conversationHistory = [], modelName = 'gemini-2.5-flash', userContext = '') => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
    console.warn('RAG: Gemini API key not available');
    return null;
  }

  try {
    // Retrieve relevant documents
    const retrievedDocs = await ragRetrieval.retrieve(query, 5, 0.2);
    
    // Format context from retrieved documents
    const context = ragRetrieval.formatContext(retrievedDocs, 2000);
    
    // Generate response using Gemini with retrieved context
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
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

