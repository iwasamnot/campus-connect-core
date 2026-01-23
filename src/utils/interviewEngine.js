/**
 * Interview Analysis Engine
 * Generates interviewer personas and analyzes candidate responses
 */

import { callAI } from './aiProvider';

/**
 * Generate interviewer persona system prompt based on role
 * @param {string} role - The job role (e.g., "Cyber Security Analyst")
 * @returns {string} - System prompt for the interviewer
 */
export const generateInterviewerPersona = (role) => {
  return `You are a strict technical recruiter for a top bank. You are interviewing a candidate for ${role}. 

Your interview style:
- Ask ONE difficult technical question at a time
- Do not be polite or friendly - be professional and direct
- Wait for their answer before asking the next question
- Focus on technical depth and problem-solving ability
- Challenge vague answers with follow-up questions if needed
- Keep questions relevant to ${role} responsibilities

Current Date: ${new Date().toLocaleDateString()}`;
};

/**
 * Analyze candidate response using STAR method and provide feedback
 * @param {string} transcript - The candidate's spoken response
 * @param {string} question - The question that was asked
 * @param {string} role - The job role being interviewed for
 * @returns {Promise<Object>} - Analysis object with feedback
 */
export const analyzeResponse = async (transcript, question, role) => {
  try {
    const analysisPrompt = `Analyze this candidate's answer to the interview question: "${question}"

Candidate's Response:
"${transcript}"

Provide a detailed analysis in the following JSON format:
{
  "starMethod": {
    "used": true/false,
    "situation": "Did they describe the situation? (yes/no/partial)",
    "task": "Did they explain the task? (yes/no/partial)",
    "action": "Did they detail their actions? (yes/no/partial)",
    "result": "Did they share the result? (yes/no/partial)"
  },
  "fillerWords": ["um", "like", "uh", ...],
  "fillerCount": 5,
  "score": 8,
  "scoreBreakdown": {
    "technicalAccuracy": 8,
    "communication": 7,
    "structure": 9,
    "relevance": 8
  },
  "strengths": ["Clear explanation", "Good technical depth"],
  "improvements": ["Use more specific examples", "Reduce filler words"],
  "specificImprovement": "Try using the STAR method more explicitly - describe the Situation, Task, Action, and Result of your example"
}

Be honest and constructive. Score out of 10.`;

    const response = await callAI(analysisPrompt, {
      systemPrompt: `You are an expert interview coach analyzing candidate responses. Provide honest, constructive feedback in the exact JSON format requested.`,
      userId: null,
      temperature: 0.7
    });

    // Parse JSON from response
    let analysis;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the entire response as JSON
        analysis = JSON.parse(response);
      }
    } catch (parseError) {
      // Fallback: Create structured response from text
      console.warn('Failed to parse JSON, creating fallback analysis:', parseError);
      analysis = {
        starMethod: {
          used: transcript.toLowerCase().includes('situation') || transcript.toLowerCase().includes('task'),
          situation: 'unknown',
          task: 'unknown',
          action: 'unknown',
          result: 'unknown'
        },
        fillerWords: (transcript.match(/\b(um|uh|like|you know|so|well)\b/gi) || []).map(w => w.toLowerCase()),
        fillerCount: (transcript.match(/\b(um|uh|like|you know|so|well)\b/gi) || []).length,
        score: 7,
        scoreBreakdown: {
          technicalAccuracy: 7,
          communication: 7,
          structure: 7,
          relevance: 7
        },
        strengths: ['Provided an answer'],
        improvements: ['Could use more structure'],
        specificImprovement: response.substring(0, 200) || 'Try to structure your answer using the STAR method (Situation, Task, Action, Result)'
      };
    }

    return {
      success: true,
      analysis: {
        ...analysis,
        transcript,
        question,
        role,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error analyzing interview response:', error);
    return {
      success: false,
      error: error.message,
      analysis: {
        starMethod: { used: false, situation: 'unknown', task: 'unknown', action: 'unknown', result: 'unknown' },
        fillerWords: [],
        fillerCount: 0,
        score: 5,
        scoreBreakdown: { technicalAccuracy: 5, communication: 5, structure: 5, relevance: 5 },
        strengths: [],
        improvements: ['Error analyzing response'],
        specificImprovement: 'Please try again'
      }
    };
  }
};

/**
 * Generate next interview question based on role and previous questions
 * @param {string} role - The job role
 * @param {Array<string>} previousQuestions - List of questions already asked
 * @returns {Promise<string>} - Next interview question
 */
export const generateNextQuestion = async (role, previousQuestions = []) => {
  try {
    const prompt = `You are a technical recruiter interviewing a candidate for ${role}.

Previous questions asked:
${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n') || 'None yet'}

Generate ONE new, challenging technical question for this role. The question should:
- Be specific to ${role} responsibilities
- Test technical knowledge and problem-solving
- Be different from previous questions
- Be answerable in 2-3 minutes

Output ONLY the question text, nothing else.`;

    const question = await callAI(prompt, {
      systemPrompt: generateInterviewerPersona(role),
      userId: null,
      temperature: 0.8
    });

    return question.trim();
  } catch (error) {
    console.error('Error generating interview question:', error);
    return `Tell me about a challenging ${role} problem you've solved and how you approached it.`;
  }
};
