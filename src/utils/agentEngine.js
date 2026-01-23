/**
 * ReAct Agent Engine - Reasoning + Acting
 * Implements a ReAct loop where the AI can reason, take actions, observe results, and continue
 */

import { callAI, getAIProvider } from './aiProvider';
import { TOOL_REGISTRY, getToolSchemas } from './tools';

const MAX_STEPS = 5; // Maximum number of reasoning/action cycles

/**
 * Parse tool call from LLM response
 * @param {string} response - LLM response text
 * @returns {Object|null} - Parsed tool call or null
 */
const parseToolCall = (response) => {
  // Try to find JSON block with tool call
  // Format: { "action": "toolName", "params": { ... } }
  const jsonMatch = response.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
  
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.action && TOOL_REGISTRY[parsed.action]) {
      return {
        action: parsed.action,
        params: parsed.params || {}
      };
    }
  } catch (error) {
    console.warn('Failed to parse tool call:', error);
  }

  return null;
};

/**
 * Execute a tool call
 * @param {string} action - Tool name
 * @param {Object} params - Tool parameters
 * @returns {Promise<Object>} - Tool execution result
 */
const executeTool = async (action, params) => {
  const tool = TOOL_REGISTRY[action];
  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${action}`
    };
  }

  try {
    const result = await tool.execute(...Object.values(params));
    return result;
  } catch (error) {
    console.error(`Error executing tool ${action}:`, error);
    return {
      success: false,
      error: error.message || `Failed to execute ${action}`
    };
  }
};

/**
 * Check if action requires human approval
 * @param {string} action - Tool name
 * @returns {boolean} - True if human approval required
 */
const requiresHumanApproval = (action) => {
  const tool = TOOL_REGISTRY[action];
  return tool?.requiresHumanApproval || false;
};

/**
 * Run ReAct Agent loop
 * @param {string} userQuery - User's question/request
 * @param {Function} onStepUpdate - Callback for step updates (for UI)
 * @returns {Promise<Object>} - Final answer and execution log
 */
export const runAgent = async (userQuery, onStepUpdate = null) => {
  const executionLog = [];
  let currentQuery = userQuery;
  let stepCount = 0;
  let finalAnswer = null;

  // System prompt with tool definitions
  const systemPrompt = `You are a ReAct Agent - a Reasoning and Acting AI assistant.
You have access to tools that you can use to help answer questions and perform actions.

AVAILABLE TOOLS:
${getToolSchemas()}

INSTRUCTIONS:
1. **REASONING:** Think about what the user is asking and what tools might help.
2. **ACTING:** If you need to use a tool, output a JSON block in this exact format:
   \`\`\`json
   {
     "action": "toolName",
     "params": {
       "param1": "value1",
       "param2": "value2"
     }
   }
   \`\`\`
3. **OBSERVING:** After I execute the tool, I will give you the result (Observation).
4. **REASONING AGAIN:** Use the observation to continue reasoning or take more actions.
5. **FINAL ANSWER:** When you have enough information, provide a clear, helpful answer to the user.

IMPORTANT:
- Only output ONE tool call per response (one JSON block)
- If you need multiple tools, call them one at a time
- After receiving an observation, reason about it and decide next steps
- If a tool requires human approval, I will ask the user first
- When you have the final answer, provide it clearly without tool calls
- Be concise but thorough

Current Date: ${new Date().toLocaleDateString()}`;

  try {
    while (stepCount < MAX_STEPS && !finalAnswer) {
      stepCount++;
      
      // Update UI with current step
      const stepInfo = {
        step: stepCount,
        query: currentQuery,
        status: 'thinking'
      };
      executionLog.push(stepInfo);
      
      if (onStepUpdate) {
        onStepUpdate({
          step: stepCount,
          status: 'thinking',
          message: `⚙️ Reasoning... (Step ${stepCount}/${MAX_STEPS})`
        });
      }

      // Step 1: Send query to LLM
      const lastObservation = executionLog.length > 0 && executionLog[executionLog.length - 1].observation
        ? executionLog[executionLog.length - 1].observation
        : null;
      
      const prompt = stepCount === 1
        ? `User Query: ${userQuery}\n\nThink about what tools you need to use to answer this question. If you need information, use the available tools.`
        : `Previous Observation: ${JSON.stringify(lastObservation, null, 2)}\n\nUser Query: ${userQuery}\n\nContinue reasoning based on the observation. Use more tools if needed, or provide the final answer if you have enough information.`;

      const response = await callAI(prompt, {
        systemPrompt: systemPrompt,
        maxTokens: 1024,
        temperature: 0.7
      });

      // Step 2: Parse response for tool call
      const toolCall = parseToolCall(response);

      if (toolCall) {
        // Check if human approval is required
        if (requiresHumanApproval(toolCall.action)) {
          executionLog[executionLog.length - 1].status = 'awaiting_approval';
          executionLog[executionLog.length - 1].toolCall = toolCall;
          executionLog[executionLog.length - 1].requiresApproval = true;
          
          if (onStepUpdate) {
            onStepUpdate({
              step: stepCount,
              status: 'awaiting_approval',
              message: `⚠️ Action requires approval: ${toolCall.action}`,
              toolCall: toolCall
            });
          }

          // Return early - need human approval
          return {
            success: false,
            requiresApproval: true,
            toolCall: toolCall,
            executionLog: executionLog,
            message: `This action requires your approval: ${toolCall.action}`
          };
        }

        // Execute tool
        executionLog[executionLog.length - 1].status = 'executing';
        executionLog[executionLog.length - 1].toolCall = toolCall;
        
        if (onStepUpdate) {
          onStepUpdate({
            step: stepCount,
            status: 'executing',
            message: `⚙️ Executing: ${toolCall.action}...`,
            toolCall: toolCall
          });
        }

        const observation = await executeTool(toolCall.action, toolCall.params);
        
        executionLog[executionLog.length - 1].observation = observation;
        executionLog[executionLog.length - 1].status = 'completed';
        
        if (onStepUpdate) {
          onStepUpdate({
            step: stepCount,
            status: 'completed',
            message: `✅ ${toolCall.action} completed`,
            observation: observation
          });
        }

        // Step 3: Feed observation back to LLM
        currentQuery = `Observation from ${toolCall.action}: ${JSON.stringify(observation, null, 2)}\n\nUser Query: ${userQuery}\n\nContinue reasoning. Use more tools if needed, or provide the final answer.`;
      } else {
        // No tool call - this is the final answer
        finalAnswer = response;
        executionLog[executionLog.length - 1].status = 'final_answer';
        executionLog[executionLog.length - 1].answer = finalAnswer;
        
        if (onStepUpdate) {
          onStepUpdate({
            step: stepCount,
            status: 'final_answer',
            message: '✅ Answer ready',
            answer: finalAnswer
          });
        }
        break;
      }
    }

    // Check if we hit max steps without final answer
    if (stepCount >= MAX_STEPS && !finalAnswer) {
      return {
        success: false,
        error: 'Maximum steps reached. The agent may need more iterations to complete the task.',
        executionLog: executionLog,
        partialAnswer: executionLog[executionLog.length - 1]?.observation || null
      };
    }

    return {
      success: true,
      answer: finalAnswer,
      executionLog: executionLog,
      steps: stepCount
    };
  } catch (error) {
    console.error('ReAct Agent error:', error);
    return {
      success: false,
      error: error.message || 'Agent execution failed',
      executionLog: executionLog
    };
  }
};

/**
 * Approve and execute a tool call that requires human approval
 * @param {Object} toolCall - Tool call object
 * @returns {Promise<Object>} - Tool execution result
 */
export const approveAndExecuteTool = async (toolCall) => {
  if (!toolCall || !toolCall.action) {
    return {
      success: false,
      error: 'Invalid tool call'
    };
  }

  return await executeTool(toolCall.action, toolCall.params || {});
};

/**
 * Continue agent execution after tool approval
 * @param {string} userQuery - Original user query
 * @param {Object} toolResult - Result from approved tool
 * @param {Function} onStepUpdate - Callback for step updates
 * @returns {Promise<Object>} - Final answer and execution log
 */
export const continueAgentAfterApproval = async (userQuery, toolResult, onStepUpdate = null) => {
  // This is a simplified continuation - in a full implementation, you'd maintain agent state
  // For now, we'll just run a new agent loop with the tool result as context
  const systemPrompt = `You are a ReAct Agent. You just executed a tool and got this result:
${JSON.stringify(toolResult, null, 2)}

User Query: ${userQuery}

Continue reasoning. Use more tools if needed, or provide the final answer.`;

  try {
    const response = await callAI(`Tool Result: ${JSON.stringify(toolResult, null, 2)}\n\nUser Query: ${userQuery}\n\nProvide the final answer.`, {
      systemPrompt: systemPrompt,
      maxTokens: 1024,
      temperature: 0.7
    });

    return {
      success: true,
      answer: response,
      executionLog: [{ step: 1, observation: toolResult, answer: response }]
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Self-Correcting & Self-Learning RAG System
 * Processes queries with automatic web search fallback and knowledge base updates
 * @param {string} userQuery - User's question
 * @param {Function} onStatusUpdate - Callback for status updates (for UI)
 * @param {string} userId - User ID for context
 * @returns {Promise<Object>} - Answer and metadata
 */
export const processQuery = async (userQuery, onStatusUpdate = null, userId = null) => {
  try {
    // Step 1: Initial Retrieval from Pinecone
    if (onStatusUpdate) {
      onStatusUpdate({ status: 'searching_internal', message: 'Searching Internal Database...' });
    }
    
    const { ragRetrieval } = await import('./ragRetrieval');
    const retrievedDocs = await ragRetrieval.retrieve(userQuery, 10, 0.01);
    
    // Format context for AI
    const context = retrievedDocs.length > 0
      ? retrievedDocs.map((doc, idx) => `${idx + 1}. ${doc.text || doc.content || ''}`).join('\n\n')
      : '';
    
    // Step 2: Ask DeepSeek if it can answer with HIGH confidence
    const confidencePrompt = `Given this internal context from the knowledge base, can you answer the following question with HIGH confidence (90%+)? 

Context:
${context || 'No relevant context found in internal database.'}

Question: ${userQuery}

Reply with ONLY "YES" or "NO". Do not provide any explanation.`;
    
    const confidenceResponse = await callAI(confidencePrompt, {
      systemPrompt: 'You are a confidence evaluator. Analyze if the provided context is sufficient to answer the question with high confidence. Reply only YES or NO.',
      maxTokens: 10,
      temperature: 0.1
    });
    
    const hasHighConfidence = confidenceResponse.trim().toUpperCase().startsWith('YES');
    
    if (hasHighConfidence && context) {
      // Step 3A: Generate answer from internal context
      if (onStatusUpdate) {
        onStatusUpdate({ status: 'generating', message: 'Answer Ready.' });
      }
      
      const answerPrompt = `Context from knowledge base:
${context}

Question: ${userQuery}

Provide a clear, accurate answer based on the context above.`;
      
      const answer = await callAI(answerPrompt, {
        systemPrompt: 'You are a helpful assistant for SISTC students. Answer questions accurately based on the provided context.',
        maxTokens: 2048,
        temperature: 0.7,
        userId: userId
      });
      
      return {
        success: true,
        answer: answer,
        source: 'internal',
        confidence: 'high',
        contextUsed: true
      };
    } else {
      // Step 3B: Search web for missing information
      if (onStatusUpdate) {
        onStatusUpdate({ status: 'searching_web', message: '⚠️ Info missing. Searching Live Web...' });
      }
      
      const { searchWeb, formatWebResults } = await import('./webSearch');
      const webResults = await searchWeb(userQuery, 5);
      
      if (webResults.length === 0) {
        // No web results - generate answer from available context anyway
        const answerPrompt = `Context (limited):
${context || 'No internal context available.'}

Question: ${userQuery}

Provide the best answer you can with the available information. If you don't know, say so.`;
        
        const answer = await callAI(answerPrompt, {
          systemPrompt: 'You are a helpful assistant. Answer based on available information.',
          maxTokens: 2048,
          temperature: 0.7,
          userId: userId
        });
        
        return {
          success: true,
          answer: answer,
          source: 'limited',
          confidence: 'low',
          contextUsed: context.length > 0
        };
      }
      
      // Step 4: Generate answer from web results
      const webContext = formatWebResults(webResults);
      const answerPrompt = `Web Search Results:
${webContext}

Question: ${userQuery}

Provide a clear, accurate answer based on the web search results above.`;
      
      const answer = await callAI(answerPrompt, {
        systemPrompt: 'You are a helpful assistant for SISTC students. Answer questions accurately based on the provided web search results.',
        maxTokens: 2048,
        temperature: 0.7,
        userId: userId
      });
      
      // Step 5: Trigger Self-Learning
      if (onStatusUpdate) {
        onStatusUpdate({ status: 'learning', message: '💾 New information found. Updating Knowledge Base...' });
      }
      
      const { learnFromWeb } = await import('./knowledgeBase');
      await learnFromWeb(userQuery, webResults);
      
      if (onStatusUpdate) {
        onStatusUpdate({ status: 'ready', message: 'Answer Ready.' });
      }
      
      return {
        success: true,
        answer: answer,
        source: 'web',
        confidence: 'medium',
        contextUsed: false,
        learned: true
      };
    }
  } catch (error) {
    console.error('🧠 [Self-Learning RAG] Error processing query:', error);
    if (onStatusUpdate) {
      onStatusUpdate({ status: 'error', message: 'Error processing query.' });
    }
    return {
      success: false,
      error: error.message
    };
  }
};
