/**
 * RAG System - Main Integration
 * Combines retrieval and generation for RAG-powered responses
 * Uses Ollama (primary) or Groq (fallback) for AI generation
 * 
 * CRITICAL: Ensures RAG context from Pinecone is properly merged into the prompt
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
 * CRITICAL: This function ensures RAG context is properly merged into the prompt
 * 
 * Prompt Structure:
 * System: You are a helpful senior student...
 * User: Context: {PINECONE_DATA} ... Question: {USER_QUESTION}
 */
export const generateRAGResponse = async (query, conversationHistory = [], modelName = null, userContext = '') => {
  // Check if RAG Engine is enabled (default: enabled)
  const ragEngineEnabled = typeof window !== 'undefined' 
    ? (localStorage.getItem('ragEngineEnabled') !== 'false') // Enabled by default
    : true;
  
  if (!ragEngineEnabled) {
    console.log('⚠️ RAG Engine is disabled');
    return null;
  }
  
  const provider = getProviderName();
  const providerDisplay = provider === 'ollama' ? 'Ollama' : provider === 'groq' ? 'Groq' : provider === 'unknown' ? 'Offline Fallback' : provider;
  
  console.log(`🔍 [OLLAMA RAG] Using provider: ${providerDisplay} for query: "${query.substring(0, 50)}..."`);

  try {
    // STEP 1: Retrieve relevant documents from Pinecone
    // CRITICAL: Lowered threshold from 0.2 to 0.01 to accept matches from different embedding models
    // We're mixing Google embeddings (in Pinecone) with hash-based query embeddings, which results in low scores
    // Accept ANY match (0.01) rather than sending zero context
    const retrievedDocs = await ragRetrieval.retrieve(query, 10, 0.01);
    console.log(`📚 [OLLAMA RAG] Retrieved ${retrievedDocs.length} documents from Pinecone`);
    
    // STEP 2: Format context from retrieved documents - all 10 results joined cleanly
    // CRITICAL: This is where Pinecone data is merged into the context string
    const context = ragRetrieval.formatContext(retrievedDocs, 3000); // Increased max length for more context
    
    // DEBUG: Log context size to verify RAG data is present
    console.log(`📏 [OLLAMA RAG] Sending context size: ${context.length} characters`);
    console.log(`📦 [OLLAMA RAG] Context preview: ${context.substring(0, 200)}...`);
    
    // STEP 3: Build conversation history
    const historyContext = conversationHistory.length > 0
      ? `\n\n**Recent Conversation:**\n${conversationHistory.slice(-4).map(msg => 
          `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 150)}`
        ).join('\n\n')}\n\n`
      : '';
    
    const userContextSection = userContext ? `\n\n**User Context:**\n${userContext}\n` : '';
    
    // STEP 4: Construct the user prompt with RAG context merged
    // CRITICAL: This prompt structure ensures:
    // - System role gets the Virtual Senior persona
    // - User role gets the RAG context + question
    const userPrompt = `**Retrieved Knowledge Base Context:**
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

    // STEP 5: System prompt (Grok-like persona - smart, witty senior student)
    const hasContext = context && context.length > 0;
    const systemPrompt = `You are the Campus Connect AI for Sydney International School of Technology and Commerce (SISTC).
Personality: You are intelligent, direct, and slightly witty. You are NOT a generic AI assistant.
Tone: Conversational and confident. Talk like a real person - like a smart senior student helping a friend.
- NEVER use robotic fillers like "Certainly!", "I can help with that", "Here is a helpful overview", or "I understand you are looking for...".
- ANSWER IMMEDIATELY. Don't announce what you are going to do.
- FORMATTING: Keep it clean. Use paragraphs for explanations. Only use bullet points for actual lists of data. Do NOT use headers (###) for short answers. Do NOT bold random words.
- CONTEXT: ${hasContext ? 'Use the provided context to answer accurate facts about SISTC, but do not explicitly say "According to the documents". Just state the facts as if you know them. If the context relevance is low, prioritize answering directly using your knowledge.' : 'Answer based on your general knowledge of IT education, university life, and student services. If you don\'t know specific SISTC details, provide general guidance.'}
- UNCERTAINTY: If you don't know, just say "I'm not sure about that one" rather than apologizing profusely.
- BE HELPFUL: Guide students effectively, but keep it natural and conversational.
Current Date: ${new Date().toLocaleDateString()}`;

    // STEP 6: Call AI with proper structure
    // System role: Virtual Senior persona
    // User role: RAG context + question
    console.log(`🚀 [OLLAMA RAG] Calling AI provider with context (${context.length} chars) and question (${query.length} chars)`);
    
    const response = await callAI(userPrompt, {
      systemPrompt: systemPrompt,
      maxTokens: 2048,
      temperature: 0.7
    });

    if (!response || response.trim().length === 0) {
      console.error('❌ [OLLAMA RAG] Empty response received from AI provider');
      return null;
    }

    console.log(`✅ [OLLAMA RAG] Response generated successfully using ${providerDisplay} (${response.length} characters)`);
    return response;
  } catch (error) {
    console.error(`❌ [OLLAMA RAG] Error generating response with ${providerDisplay}:`, error);
    console.error(`❌ [OLLAMA RAG] Error details:`, {
      message: error.message,
      stack: error.stack,
      query: query.substring(0, 100)
    });
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
