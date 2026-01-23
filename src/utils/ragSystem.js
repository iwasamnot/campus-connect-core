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
import { processConnection, formatConnectionOffer } from './connectionEngine';

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
export const generateRAGResponse = async (query, conversationHistory = [], modelName = null, userContext = '', userId = null) => {
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
    // Build user prompt with RAG context - format for Smart Researcher persona
    const userPrompt = `**Retrieved Knowledge Base Context:**
${context || 'No specific context retrieved. Use your general knowledge about universities and student services.'}

${historyContext}${userContextSection}
**User Question:**
${query}

**Instructions:**
- Use the retrieved context as your primary source of information for SISTC-specific questions
- **CITE SOURCES:** When using information from the context, cite it immediately: [Source: Document Title]
- **ADD FUN FACTS:** When relevant, include interesting tidbits or fun facts that make your answer more engaging (like a charismatic senior student would)
- If the context contains relevant information, prioritize it in your response
- Maintain continuity with the conversation history when relevant
- Use the user context to personalize your responses when appropriate
- For questions not fully covered by the context, supplement with your general knowledge
- Write with flair and confidence - be engaging but academically rigorous
- Use Markdown headers (###) to organize longer answers
- If you don't know something, just say "I'm not sure about that one"`;

    // STEP 5: System prompt (Smart Researcher persona - witty + rigorous with citations + fun facts)
    // Load core memory for context injection
    let coreMemoryContext = '';
    if (userId) {
      try {
        const { getCoreMemoryContext } = await import('./memoryStore');
        const memoryContext = getCoreMemoryContext(userId);
        if (memoryContext && memoryContext !== 'No core memory available yet.') {
          coreMemoryContext = `\n\nUSER CONTEXT (Core Memory):\n${memoryContext}\n\nUse this context to personalize your responses. Reference the user's name, goals, and preferences when relevant.`;
        }
      } catch (error) {
        console.warn('💾 [Memory] Failed to load core memory for RAG:', error);
      }
    }
    
    const hasContext = context && context.length > 0;
    const systemPrompt = `You are the Campus Connect AI for Sydney International School of Technology and Commerce (SISTC).
IDENTITY:
You are a witty, highly intelligent, and rigorous research assistant. You are like a very intelligent, charismatic senior student who knows their stuff and isn't afraid to show it. You are NOT a boring, generic chatbot. You write with flair, confidence, and precision.${coreMemoryContext}

CORE INSTRUCTIONS:
1. **THE VIBE:** Be direct and engaging. Avoid robotic fillers like "I hope this helps" or "Certainly!". Write like a smart senior student who knows their stuff and enjoys sharing knowledge.
2. **THE PROOF (Citations):** You deal in facts. ${hasContext ? 'Whenever you state a fact from the provided context, you MUST cite the source immediately in brackets [Source: Document Title]. Example: "The Bachelor of IT program is 3 years [Source: Course_Catalog_2025.pdf], and it\'s ACS certified which is pretty solid."' : 'When stating facts, cite sources when available. If no specific source, use your general knowledge confidently.'}
3. **FUN FACTS:** When relevant, sprinkle in interesting tidbits or fun facts that make the answer more engaging. These should be:
   - Related to the topic
   - Actually interesting or surprising
   - Natural, not forced
   - Example: "SISTC opened in 2020 [Source: About_SISTC.pdf], which makes it relatively new - but they've already got ACS certification, which is pretty impressive for a young institution."
4. **THE FORMAT:**
   - Use Markdown headers (###) to organize your thoughts.
   - Use bullet points for lists.
   - Keep paragraphs punchy.

GOAL:
Produce an answer that is fun to read (like chatting with a charismatic senior student) but academically solid enough to be put in a report.
Current Date: ${new Date().toLocaleDateString()}`;

    // STEP 6: Connection Engine - Process user question for matching
    let connectionOffer = '';
    if (userId) {
      try {
        const connectionResult = await processConnection(userId, query);
        if (connectionResult.matches && connectionResult.matches.length >= 2) {
          connectionOffer = formatConnectionOffer(connectionResult.matches, connectionResult.topicTag);
          console.log(`🔗 [Connection Engine] Connection offer generated for ${connectionResult.matches.length} matches`);
        }
      } catch (error) {
        console.warn('Connection Engine: Error processing connection (non-critical):', error);
        // Don't fail the entire request if connection engine fails
      }
    }

    // STEP 7: Call AI with proper structure
    // System role: Virtual Senior persona
    // User role: RAG context + question
    console.log(`🚀 [OLLAMA RAG] Calling AI provider with context (${context.length} chars) and question (${query.length} chars)`);
    
    const response = await callAI(userPrompt, {
      systemPrompt: systemPrompt,
      maxTokens: 2048,
      temperature: 0.7,
      userId: userId || null // Pass userId for Connection Matcher
    });

    if (!response || response.trim().length === 0) {
      console.error('❌ [OLLAMA RAG] Empty response received from AI provider');
      return null;
    }

    // STEP 8: Append connection offer to response if available
    const finalResponse = connectionOffer 
      ? `${response}${connectionOffer}`
      : response;

    console.log(`✅ [OLLAMA RAG] Response generated successfully using ${providerDisplay} (${finalResponse.length} characters)`);
    return finalResponse;
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
