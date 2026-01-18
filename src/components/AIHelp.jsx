import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { FadeIn, StaggerContainer, StaggerItem } from './AnimatedComponents';
import { Send, Bot, Loader, BookOpen, GraduationCap, MapPin, Phone, Mail, Calendar, Sparkles, Brain, Lightbulb, HelpCircle, Clock, TrendingUp, Book, User, Edit2, X, Check } from 'lucide-react';
import { callAI } from '../utils/aiProvider';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getUserProfile, updateProfileFromConversation, getPersonalizedSystemPrompt, updateAssistantName } from '../utils/userProfileAI';
import { useAuth } from '../context/AuthContext';


// Enhanced SISTC Knowledge Base with more detailed information
const SISTC_KNOWLEDGE_BASE = {
  about: {
    story: "Sydney International School of Technology and Commerce (SISTC) opened its doors in 2020. We offer innovative courses designed to prepare students for careers in Information Technology.",
    focus: "SISTC focuses on providing quality IT education with industry partnerships and work-integrated learning opportunities.",
    locations: "SISTC has campuses in Sydney CBD, Parramatta, and Melbourne.",
    accreditation: "SISTC is an Accredited Institute of Higher Education. TEQSA PRV14311, CRICOS 03836J, ABN 746 130 55440",
    mission: "To provide innovative IT education that prepares students for successful careers in the information economy."
  },
  courses: {
    undergraduate: [
      {
        name: "Bachelor of Information Technology",
        majors: ["Business Information Systems", "Digital Enterprise"],
        certified: "ACS Certified",
        nested: ["Diploma of Business Information Systems", "Diploma of Information Technology"],
        duration: "3 years full-time",
        description: "Comprehensive IT degree with choice of two majors focusing on business applications or digital transformation."
      }
    ],
    postgraduate: [
      {
        name: "Master of Information Technology",
        specialisations: ["Data Analytics", "Digital Leadership", "Cyber Security Major"],
        certified: "ACS Certified",
        nested: ["Graduate Diploma in IT", "Graduate Certificate in IT"],
        duration: "2 years full-time",
        description: "Advanced IT degree with three specialisation options for career advancement."
      }
    ]
  },
  locations: {
    sydney: {
      description: "Sydney CBD campus is located in the heart of Sydney's Central Business District (CBD), amidst cafes, shopping, and entertainment.",
      highlights: ["Iconic Landmarks at Sydney Harbour", "World-Class Shopping in CBD", "Diverse Dining Across the City"],
      address: "Sydney CBD, New South Wales"
    },
    parramatta: {
      description: "Parramatta is a vibrant and rapidly growing city located in the heart of Greater Western Sydney.",
      highlights: ["Fantastic Shopping at Westfield Parramatta", "Global Cuisine on Church Street", "Historic Landmarks in Parramatta Park"],
      address: "Parramatta, Greater Western Sydney, New South Wales"
    },
    melbourne: {
      description: "Melbourne is a vibrant city known for its trendy shopping, diverse dining, rich arts scene, beautiful parks, and world-class sporting events.",
      highlights: ["Trendy Shopping on Collins Street", "Laneway Cafés and Global Cuisine", "Iconic Arts and Music Festivals"],
      address: "Melbourne, Victoria"
    }
  },
  contact: {
    phone: "+61 (2) 9061 5900",
    website: "https://sistc.edu.au/",
    campuses: ["Sydney", "Parramatta", "Melbourne"],
    email: "General enquiries available through website contact form"
  },
  statistics: {
    students: "500+ Students in Sydney & Melbourne",
    teaching: "85.1% rated Teaching Practices positively (National average: 79.8%)",
    support: "85.4% rated Support Services positively (National average: 72.7%)",
    development: "82.4% rated Skill Development positively (National average: 79.8%)",
    survey: "Based on Undergraduate Student Experience Survey 2021-2022"
  },
  applying: {
    requirements: "A Student visa is required for International Students. You must always follow the conditions of your visa.",
    process: "Entry Requirements, Credit for Prior Learning, Education Agents, How to Apply, Fees",
    steps: [
      "Check entry requirements for your chosen course",
      "Apply for credit for prior learning if applicable",
      "Contact an education agent or apply directly",
      "Submit application with required documents",
      "Pay application fees",
      "Receive offer and accept",
      "Apply for student visa (international students)"
    ]
  },
  support: {
    services: "Student Support, Digital Library, Graduation support available",
    academic: "Academic Integrity, Work Integrated Learning, Capstone Projects Expo",
    wellbeing: "Health & Wellbeing support available",
    library: "Digital Library with extensive resources"
  },
  life: {
    studentLife: "SISTC offers a vibrant student life with various activities and support services",
    womenInIT: "Women in IT program to support female students",
    capstone: "Capstone Projects Expo showcases student work",
    workIntegrated: "Work Integrated Learning opportunities available"
  }
};

// Advanced question understanding and classification
class IntelligentAI {
  constructor() {
    this.context = [];
    this.synonyms = {
      course: ['program', 'degree', 'study', 'education', 'qualification', 'certificate', 'diploma'],
      location: ['campus', 'where', 'address', 'place', 'city', 'site'],
      contact: ['phone', 'email', 'reach', 'call', 'speak', 'talk', 'connect'],
      apply: ['application', 'enroll', 'enrolment', 'admission', 'join', 'register', 'sign up'],
      fee: ['cost', 'price', 'tuition', 'payment', 'charge', 'expense', 'money'],
      about: ['what is', 'tell me', 'information', 'details', 'overview', 'background'],
      support: ['help', 'assistance', 'service', 'aid', 'guidance'],
      requirement: ['need', 'require', 'prerequisite', 'eligibility', 'qualification']
    };
  }

  // Calculate similarity between two strings
  similarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const distance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - distance) / longer.length;
  }

  // Levenshtein distance for fuzzy matching
  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  // Extract keywords and intent
  extractIntent(question) {
    const lower = question.toLowerCase();
    const intents = {
      course: 0,
      location: 0,
      contact: 0,
      apply: 0,
      fee: 0,
      about: 0,
      support: 0,
      requirement: 0
    };

    // Check for direct matches
    Object.keys(this.synonyms).forEach(intent => {
      this.synonyms[intent].forEach(synonym => {
        if (lower.includes(synonym)) {
          intents[intent] += 2;
        }
      });
    });

    // Check for specific course names
    if (lower.includes('bachelor') || lower.includes('undergraduate') || lower.includes('bachelor of')) {
      intents.course += 3;
      intents.requirement += 1;
    }
    if (lower.includes('master') || lower.includes('postgraduate') || lower.includes('graduate')) {
      intents.course += 3;
      intents.requirement += 1;
    }

    // Check for location names
    if (lower.includes('sydney')) intents.location += 3;
    if (lower.includes('parramatta')) intents.location += 3;
    if (lower.includes('melbourne')) intents.location += 3;

    // Check for question types
    if (lower.startsWith('what') || lower.startsWith('which') || lower.startsWith('tell me')) {
      intents.about += 2;
    }
    if (lower.startsWith('how') || lower.startsWith('can i')) {
      intents.apply += 2;
      intents.support += 1;
    }
    if (lower.startsWith('where')) {
      intents.location += 3;
    }
    if (lower.startsWith('when')) {
      intents.about += 1;
    }

    // Find dominant intent
    const maxIntent = Object.keys(intents).reduce((a, b) => intents[a] > intents[b] ? a : b);
    return intents[maxIntent] > 0 ? maxIntent : 'about';
  }

  // Generate comprehensive answer
  generateAnswer(question, intent) {
    const lower = question.toLowerCase();
    let answer = '';

    switch (intent) {
      case 'course':
        if (lower.includes('bachelor') || lower.includes('undergraduate') || lower.includes('degree')) {
          const course = SISTC_KNOWLEDGE_BASE.courses.undergraduate[0];
          answer = `**${course.name}**\n\n${course.description}\n\n**Duration:** ${course.duration}\n\n**Majors Available:**\n${course.majors.map(m => `• ${m}`).join('\n')}\n\n**Certification:** ${course.certified}\n\n**Nested Courses (Exit Only):**\n${course.nested.map(n => `• ${n}`).join('\n')}\n\nThis program prepares you for a career in IT with a focus on either business information systems or digital enterprise transformation.`;
        } else if (lower.includes('master') || lower.includes('postgraduate') || lower.includes('graduate')) {
          const course = SISTC_KNOWLEDGE_BASE.courses.postgraduate[0];
          answer = `**${course.name}**\n\n${course.description}\n\n**Duration:** ${course.duration}\n\n**Specialisations Available:**\n${course.specialisations.map(s => `• ${s}`).join('\n')}\n\n**Certification:** ${course.certified}\n\n**Nested Courses (Exit Only):**\n${course.nested.map(n => `• ${n}`).join('\n')}\n\nThis advanced program allows you to specialise in data analytics, digital leadership, or cyber security.`;
        } else {
          answer = `SISTC offers comprehensive IT education programs:\n\n**Undergraduate Programs:**\n• **${SISTC_KNOWLEDGE_BASE.courses.undergraduate[0].name}** - ${SISTC_KNOWLEDGE_BASE.courses.undergraduate[0].description}\n  - Majors: ${SISTC_KNOWLEDGE_BASE.courses.undergraduate[0].majors.join(', ')}\n\n**Postgraduate Programs:**\n• **${SISTC_KNOWLEDGE_BASE.courses.postgraduate[0].name}** - ${SISTC_KNOWLEDGE_BASE.courses.postgraduate[0].description}\n  - Specialisations: ${SISTC_KNOWLEDGE_BASE.courses.postgraduate[0].specialisations.join(', ')}\n\nAll courses are ${SISTC_KNOWLEDGE_BASE.courses.undergraduate[0].certified}.`;
        }
        break;

      case 'location':
        if (lower.includes('sydney')) {
          const loc = SISTC_KNOWLEDGE_BASE.locations.sydney;
          answer = `**Sydney Campus**\n\n${loc.description}\n\n**Address:** ${loc.address}\n\n**Highlights:**\n${loc.highlights.map(h => `• ${h}`).join('\n')}\n\nThe Sydney CBD campus offers easy access to public transport, shopping, dining, and entertainment.`;
        } else if (lower.includes('parramatta')) {
          const loc = SISTC_KNOWLEDGE_BASE.locations.parramatta;
          answer = `**Parramatta Campus**\n\n${loc.description}\n\n**Address:** ${loc.address}\n\n**Highlights:**\n${loc.highlights.map(h => `• ${h}`).join('\n')}\n\nParramatta is a growing hub in Western Sydney with excellent amenities and transport links.`;
        } else if (lower.includes('melbourne')) {
          const loc = SISTC_KNOWLEDGE_BASE.locations.melbourne;
          answer = `**Melbourne Campus**\n\n${loc.description}\n\n**Address:** ${loc.address}\n\n**Highlights:**\n${loc.highlights.map(h => `• ${h}`).join('\n')}\n\nMelbourne offers a vibrant cultural scene and is known for its excellent quality of life.`;
        } else {
          answer = `SISTC operates three campuses across Australia:\n\n**1. Sydney CBD**\n${SISTC_KNOWLEDGE_BASE.locations.sydney.description}\n\n**2. Parramatta**\n${SISTC_KNOWLEDGE_BASE.locations.parramatta.description}\n\n**3. Melbourne**\n${SISTC_KNOWLEDGE_BASE.locations.melbourne.description}\n\nEach campus offers modern facilities and excellent student support services.`;
        }
        break;

      case 'contact':
        answer = `**Contact SISTC**\n\n**Phone:** ${SISTC_KNOWLEDGE_BASE.contact.phone}\n**Website:** ${SISTC_KNOWLEDGE_BASE.contact.website}\n**Email:** ${SISTC_KNOWLEDGE_BASE.contact.email}\n\n**Campus Locations:**\n${SISTC_KNOWLEDGE_BASE.contact.campuses.map(c => `• ${c}`).join('\n')}\n\nYou can visit us at any of our campuses or contact us via phone or email for general enquiries, feedback, and appeals.`;
        break;

      case 'apply':
        if (lower.includes('step') || lower.includes('process') || lower.includes('how')) {
          answer = `**Application Process**\n\n${SISTC_KNOWLEDGE_BASE.applying.requirements}\n\n**Steps to Apply:**\n${SISTC_KNOWLEDGE_BASE.applying.steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}\n\n**What You'll Need:**\n• Academic transcripts\n• English language proficiency (for international students)\n• Student visa application (for international students)\n• Application fee\n\nFor detailed information, visit: ${SISTC_KNOWLEDGE_BASE.contact.website}`;
        } else {
          answer = `**Applying to SISTC**\n\n${SISTC_KNOWLEDGE_BASE.applying.requirements}\n\n**Application Includes:**\n${SISTC_KNOWLEDGE_BASE.applying.process.split(',').map(p => `• ${p.trim()}`).join('\n')}\n\nInternational students will need a Student visa. Visit ${SISTC_KNOWLEDGE_BASE.contact.website} for detailed application information.`;
        }
        break;

      case 'fee':
        answer = `**Fees & Charges**\n\nFee structures vary depending on:\n• Course level (undergraduate/postgraduate)\n• Study mode (full-time/part-time)\n• Student type (domestic/international)\n• Credit for prior learning\n\n**For Detailed Fee Information:**\n• Visit the Fees section on our website: ${SISTC_KNOWLEDGE_BASE.contact.website}\n• Contact us directly: ${SISTC_KNOWLEDGE_BASE.contact.phone}\n• Speak with an education agent\n\nWe also offer information about payment plans and financial assistance options.`;
        break;

      case 'requirement':
        if (lower.includes('bachelor') || lower.includes('undergraduate')) {
          answer = `**Entry Requirements for Bachelor of Information Technology**\n\n**Academic Requirements:**\n• Australian Year 12 qualification or equivalent\n• Minimum ATAR or equivalent score (check website for current requirements)\n\n**English Language Requirements (International Students):**\n• IELTS, TOEFL, or equivalent English proficiency test\n• Minimum scores vary - check current requirements\n\n**Additional Requirements:**\n• Student visa for international students\n• Health insurance (OSHC) for international students\n\nFor current specific requirements, visit: ${SISTC_KNOWLEDGE_BASE.contact.website}`;
        } else if (lower.includes('master') || lower.includes('postgraduate')) {
          answer = `**Entry Requirements for Master of Information Technology**\n\n**Academic Requirements:**\n• Bachelor's degree in IT or related field, OR\n• Graduate Diploma or Graduate Certificate in IT\n• Relevant work experience may be considered\n\n**English Language Requirements (International Students):**\n• IELTS, TOEFL, or equivalent English proficiency test\n• Higher minimum scores than undergraduate programs\n\n**Additional Requirements:**\n• Student visa for international students\n• Health insurance (OSHC) for international students\n\nFor current specific requirements, visit: ${SISTC_KNOWLEDGE_BASE.contact.website}`;
        } else {
          answer = `**Entry Requirements**\n\nRequirements vary by course level:\n\n**Undergraduate:** Australian Year 12 or equivalent\n**Postgraduate:** Bachelor's degree or equivalent\n\n**For International Students:**\n• Student visa required\n• English language proficiency test\n• Health insurance (OSHC)\n\nFor detailed, current requirements, visit: ${SISTC_KNOWLEDGE_BASE.contact.website}`;
        }
        break;

      case 'support':
        answer = `**Student Support Services**\n\n${SISTC_KNOWLEDGE_BASE.support.services}\n\n**Academic Support:**\n${SISTC_KNOWLEDGE_BASE.support.academic}\n\n**Additional Support:**\n• ${SISTC_KNOWLEDGE_BASE.support.wellbeing}\n• ${SISTC_KNOWLEDGE_BASE.support.library}\n\n**Student Life:**\n${SISTC_KNOWLEDGE_BASE.life.studentLife}\n• ${SISTC_KNOWLEDGE_BASE.life.womenInIT}\n• ${SISTC_KNOWLEDGE_BASE.life.capstone}\n• ${SISTC_KNOWLEDGE_BASE.life.workIntegrated}\n\nContact: ${SISTC_KNOWLEDGE_BASE.contact.phone} or visit ${SISTC_KNOWLEDGE_BASE.contact.website}`;
        break;

      case 'about':
      default:
        if (lower.includes('rating') || lower.includes('statistic') || lower.includes('review')) {
          answer = `**Student Feedback & Statistics**\n\n${SISTC_KNOWLEDGE_BASE.statistics.students}\n\n**Teaching Practices:** ${SISTC_KNOWLEDGE_BASE.statistics.teaching}\n**Support Services:** ${SISTC_KNOWLEDGE_BASE.statistics.support}\n**Skill Development:** ${SISTC_KNOWLEDGE_BASE.statistics.development}\n\n*${SISTC_KNOWLEDGE_BASE.statistics.survey}*\n\nThese ratings demonstrate SISTC's commitment to providing quality education and student support.`;
        } else {
          answer = `**About SISTC**\n\n${SISTC_KNOWLEDGE_BASE.about.story}\n\n**Our Mission:** ${SISTC_KNOWLEDGE_BASE.about.mission}\n\n**Our Focus:** ${SISTC_KNOWLEDGE_BASE.about.focus}\n\n**Accreditation:** ${SISTC_KNOWLEDGE_BASE.about.accreditation}\n\n**Locations:** ${SISTC_KNOWLEDGE_BASE.about.locations}\n\n**Student Statistics:** ${SISTC_KNOWLEDGE_BASE.statistics.students}\n\nSISTC is committed to providing innovative IT education that prepares students for successful careers in the information economy.`;
        }
        break;
    }

    // Add context-aware follow-up
    if (this.context.length > 0) {
      const lastIntent = this.context[this.context.length - 1].intent;
      if (lastIntent === intent && this.context.length > 1) {
        answer += `\n\nIs there anything specific about this topic you'd like to know more about?`;
      }
    }

    return answer;
  }

  // Main processing function
  processQuestion(question) {
    const intent = this.extractIntent(question);
    const answer = this.generateAnswer(question, intent);
    
    // Store context
    this.context.push({ question, intent, timestamp: Date.now() });
    if (this.context.length > 5) {
      this.context.shift(); // Keep only last 5 interactions
    }

    return answer;
  }
}

const AIHelp = () => {
  const { darkMode } = useTheme();
  const { success, error: showError, warning } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI Assistant. I can help you with SISTC information, study tips, homework help, and more. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGeminiModel, setSelectedGeminiModel] = useState('gemini-2.5-flash'); // Default model (latest 2026 version)
  const [activeTab, setActiveTab] = useState('sistc'); // sistc, study-tips, homework-help
  const [userProfile, setUserProfile] = useState(null);
  const [editingAssistantName, setEditingAssistantName] = useState(false);
  const [assistantNameInput, setAssistantNameInput] = useState('AI Assistant');
  const messagesEndRef = useRef(null);
  const ai = useRef(new IntelligentAI());
  
  // Load user profile on mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      getUserProfile(user.uid).then(profile => {
        if (profile) {
          setUserProfile(profile);
          setAssistantNameInput(profile.assistantName || 'AI Assistant');
          // Update greeting with personalized assistant name and user name
          const assistantName = profile.assistantName || 'AI Assistant';
          const userName = profile.userName ? ` ${profile.userName}` : '';
          const greeting = userName 
            ? `Hello${userName}! I'm ${assistantName}. I can help you with SISTC information, study tips, homework help, and more. What would you like to know?`
            : `Hello! I'm ${assistantName}. I can help you with SISTC information, study tips, homework help, and more. What would you like to know?`;
          
          // Only update greeting if messages haven't been changed yet (first message is still default)
          setMessages(prev => {
            if (prev.length === 1 && prev[0].id === 1) {
              return [{
                id: 1,
                type: 'bot',
                content: greeting,
                timestamp: new Date()
              }];
            }
            return prev; // Keep existing messages if conversation has started
          });
        }
      });
    }
  }, [user]);

  // Available Gemini models
  const geminiModels = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Latest 2026 Model - Fast & Efficient (Recommended)', free: true },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Free - Fast & Efficient', free: true },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B', description: 'Free - Lightweight & Fast', free: true },
    { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro', description: 'Paid - Most Capable', free: false },
    { value: 'gemini-pro', label: 'Gemini Pro', description: 'Deprecated - Use 2.5 Flash instead', free: false },
  ];

  // Initialize Gemini AI with selected model
  const getGeminiModel = (modelName = selectedGeminiModel) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === '') {
      return null;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use the selected model, fallback to gemini-2.5-flash if model not found
      const modelToUse = modelName || 'gemini-2.5-flash';
      const model = genAI.getGenerativeModel({ 
        model: modelToUse,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
        systemInstruction: `You are an intelligent, knowledgeable, and empathetic AI assistant for Sydney International School of Technology and Commerce (SISTC). Your role is to provide comprehensive, accurate, and helpful information to students, prospective students, and visitors.

**Your Capabilities:**
- Provide detailed information about SISTC courses, programs, campuses, and student services
- Answer questions about applications, admissions, fees, and requirements
- Offer guidance on student life, support services, and resources
- Help with general academic and university-related questions
- Maintain context from conversation history to provide coherent, relevant responses

**Your Approach:**
- Be thorough but concise - provide complete information without unnecessary verbosity
- Use a friendly, professional, and approachable tone
- Structure your responses clearly with headings, lists, and formatting when helpful
- If asked about SISTC-specific information, prioritize accuracy and reference the knowledge base provided
- For general questions, use your knowledge while maintaining relevance to the educational context
- Show empathy and understanding when addressing student concerns or questions
- If you don't know something, be honest and suggest where they might find the information

**Response Format:**
- Use markdown formatting (headings, lists, bold, italic) for better readability
- Break down complex topics into clear sections
- Use bullet points or numbered lists for step-by-step information
- Include relevant details, examples, or practical advice when appropriate`,
      });
      return model;
    } catch (error) {
      console.error('Error initializing Gemini model:', error);
      // Fallback to gemini-2.5-flash, then gemini-1.5-flash if the selected model fails
      if (modelName !== 'gemini-2.5-flash') {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        } catch (fallbackError) {
          console.warn('gemini-2.5-flash not available, trying gemini-1.5-flash:', fallbackError);
          try {
            const genAI = new GoogleGenerativeAI(apiKey);
            return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          } catch (secondFallbackError) {
            console.error('Fallback models also failed:', secondFallbackError);
            return null;
          }
        }
      }
      return null;
    }
  };

  // Call AI with conversation history (multi-provider support)
  const callAIWithHistory = async (question, localContext, conversationHistory = []) => {
    try {
      const { callAI } = await import('../utils/aiProvider');
      
      // Build conversation history for context
      const historyContext = conversationHistory.length > 0 
        ? `\n\n**Conversation History:**\n${conversationHistory.slice(-6).map((msg, idx) => {
            if (msg.type === 'user') {
              return `User: ${msg.content}`;
            } else {
              return `Assistant: ${msg.content.substring(0, 200)}...`;
            }
          }).join('\n\n')}\n\n`
        : '';

      const prompt = `**Context Information:**

Use the following SISTC knowledge base information as your primary reference for SISTC-specific questions:
${localContext ? `\n${localContext}\n` : '\nNo specific knowledge base context available. Use your general knowledge about universities and student services.\n'}

${historyContext}

**Current Question:**
${question}

**Instructions:**
- If the question is about SISTC specifically, prioritize the knowledge base information provided above
- Maintain continuity with the conversation history if relevant
- For general questions or if the knowledge base doesn't fully cover the topic, supplement with your knowledge
- Provide comprehensive, well-structured answers that are thorough yet concise
- Use markdown formatting for better readability
- Be helpful, empathetic, and professional in your responses`;

      const text = await callAI(prompt, {
        systemPrompt: 'You are a helpful assistant for SISTC students. Provide accurate, helpful information.',
        maxTokens: 2048,
        temperature: 0.7
      });

      if (text && text.trim()) {
        return text.trim();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error calling AI:', error);
      return null;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize RAG system on mount
  useEffect(() => {
    const initRAG = async () => {
      try {
        const { initializeRAG } = await import('../utils/ragSystem');
        await initializeRAG();
      } catch (error) {
        console.warn('RAG initialization error (will use fallback):', error);
      }
    };
    initRAG();
  }, []);


  // Intelligent AI: Use RAG with Gemini, fallback to local knowledge base
  const getHybridAIResponse = async (question) => {
    // Build conversation history from messages (excluding the system message)
    const conversationHistory = messages
      .filter(msg => msg.id !== 1) // Exclude the initial greeting
      .slice(-10) // Keep last 10 messages for context
      .map(msg => ({
        type: msg.type === 'bot' ? 'bot' : 'user',
        content: msg.content
      }));
    
    // Add user profile context to prompt
    const userContext = userProfile ? getPersonalizedSystemPrompt(userProfile, 'sistc') : '';
    
    // Try RAG-enhanced Gemini if API key is available
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    
    if (geminiApiKey && geminiApiKey !== '') {
      try {
        // Import RAG system dynamically
        const { generateRAGResponse } = await import('../utils/ragSystem');
        const ragAnswer = await generateRAGResponse(question, conversationHistory, selectedGeminiModel, userContext);
        if (ragAnswer && ragAnswer.trim() !== '') {
          return ragAnswer;
        }
      } catch (ragError) {
        console.warn('RAG system error, falling back to standard Gemini:', ragError);
      }
      
      // Fallback to AI with local knowledge base and user context
      const localAnswer = ai.current.processQuestion(question);
      const enhancedPrompt = userContext 
        ? `${userContext}\n\n${question}`
        : question;
      const aiAnswer = await callAIWithHistory(enhancedPrompt, localAnswer, conversationHistory);
      if (aiAnswer && aiAnswer.trim() !== '') {
        return aiAnswer;
      }
    }
    
    // Final fallback to local knowledge base answer
    const localAnswer = ai.current.processQuestion(question);
    return localAnswer;
  };

  const handleSend = async (e, customQuestion = null) => {
    if (e) e.preventDefault();
    const question = customQuestion || input.trim();
    if (!question || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const questionText = question;
    if (!customQuestion) setInput('');
    setLoading(true);

    try {
      let answer;
      
      // Use different AI based on active tab
      if (activeTab === 'sistc') {
        // SISTC tab: Use hybrid AI with knowledge base
        answer = await getHybridAIResponse(questionText);
      } else {
        // Study tips/homework: Use multi-provider AI with personalized context
        const personalizedPrompt = getPersonalizedSystemPrompt(userProfile, activeTab);
        
        let systemPrompt = personalizedPrompt;
        
        if (!userProfile) {
          // Fallback if no profile
          if (activeTab === 'study-tips') {
            systemPrompt = 'You are an expert study coach. Provide practical study tips, time management advice, and learning strategies.';
          } else if (activeTab === 'homework-help') {
            systemPrompt = 'You are a tutor that helps students understand concepts and solve problems. Guide them to solutions rather than giving direct answers.';
          }
        }

        const prompt = `${questionText}\n\nProvide a helpful, educational response.`;
        answer = await callAI(prompt, {
          systemPrompt,
          maxTokens: 1000,
          temperature: 0.7
        });
      }

      if (!answer || answer.trim() === '') {
        throw new Error('No answer generated');
      }
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: answer,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Update user profile from conversation (debounced)
      if (user?.uid && messages.length > 0) {
        setTimeout(() => {
          updateProfileFromConversation(user.uid, [
            ...messages.filter(m => m.id !== 1),
            userMessage,
            botMessage
          ]).then(() => {
            // Refresh profile after update
            getUserProfile(user.uid).then(profile => {
              if (profile) setUserProfile(profile);
            });
          });
        }, 2000); // Wait 2 seconds after response
      }
    } catch (err) {
      console.error('Error getting AI response:', err);
      
      // Final fallback to local knowledge base (for SISTC) or error message
      try {
        let fallbackAnswer;
        if (activeTab === 'sistc') {
          fallbackAnswer = ai.current.processQuestion(questionText);
        } else {
          fallbackAnswer = "I apologize, but I'm having trouble accessing my AI service right now. Please try again later.";
        }
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: fallbackAnswer || "I apologize, but I'm having trouble accessing my knowledge base right now. Please try again later or contact SISTC directly at +61 (2) 9061 5900 or visit https://sistc.edu.au/",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
        const errorBotMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: "I apologize, but I'm having trouble accessing my knowledge base right now. Please try again later or contact SISTC directly at +61 (2) 9061 5900 or visit https://sistc.edu.au/",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorBotMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = {
    'sistc': [
      { icon: GraduationCap, text: "What courses do you offer?", question: "What courses do you offer?" },
      { icon: MapPin, text: "Where are your campuses?", question: "Where are your campuses located?" },
      { icon: Phone, text: "How can I contact you?", question: "How can I contact SISTC?" },
      { icon: BookOpen, text: "How do I apply?", question: "What is the application process?" },
      { icon: Calendar, text: "What are the entry requirements?", question: "What are the entry requirements for the Bachelor program?" }
    ],
    'study-tips': [
      { icon: Clock, text: "Time management", question: "How can I better manage my study time?" },
      { icon: Brain, text: "Memory techniques", question: "What memory techniques work best for exams?" },
      { icon: TrendingUp, text: "Productivity", question: "How can I be more productive while studying?" },
      { icon: HelpCircle, text: "Study schedule", question: "How should I organize my study schedule?" },
      { icon: Lightbulb, text: "Learning strategies", question: "What are effective learning strategies?" }
    ],
    'homework-help': [
      { icon: Book, text: "Problem solving", question: "Can you help me understand how to approach this problem?" },
      { icon: GraduationCap, text: "Course help", question: "I need help with my course material" },
      { icon: HelpCircle, text: "Concept clarification", question: "Can you clarify this concept for me?" },
      { icon: BookOpen, text: "Explain concept", question: "Can you explain this concept in simple terms?" },
      { icon: Brain, text: "Study techniques", question: "What study techniques work best for this subject?" }
    ]
  };

  const handleQuickQuestion = (question) => {
    handleSend(null, question);
  };

  const formatMessage = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let key = 0;

    lines.forEach((line, idx) => {
      if (line.trim() === '') {
        elements.push(<br key={`br-${key++}`} />);
        return;
      }

      // Bold text
      if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <strong key={`bold-${key++}`} className="font-bold text-indigo-300">
            {line.slice(2, -2)}
          </strong>
        );
        return;
      }

      // Bullet points
      if (line.trim().startsWith('•')) {
        elements.push(
          <div key={`bullet-${key++}`} className="ml-4 my-1">
            {line}
          </div>
        );
        return;
      }

      // Numbered list
      if (/^\d+\.\s/.test(line.trim())) {
        elements.push(
          <div key={`numbered-${key++}`} className="ml-4 my-1">
            {line}
          </div>
        );
        return;
      }

      // Regular text
      elements.push(
        <div key={`text-${key++}`} className="my-1">
          {line}
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-transparent relative overflow-hidden">
      {/* Header - Fluid.so aesthetic */}
      <FadeIn delay={0.1}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border-b border-white/10 px-4 md:px-6 py-3 md:py-4 rounded-t-[2rem] flex-shrink-0 relative z-10"
          style={{
            paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
            paddingBottom: `0.75rem`,
            paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
            paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="p-2 bg-indigo-600/30 border border-indigo-500/50 rounded-xl flex-shrink-0"
              >
                <Bot className="text-indigo-300 md:w-6 md:h-6" size={20} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {editingAssistantName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={assistantNameInput}
                        onChange={(e) => setAssistantNameInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            if (user?.uid && assistantNameInput.trim()) {
                              updateAssistantName(user.uid, assistantNameInput.trim()).then(() => {
                                setUserProfile(prev => ({ ...prev, assistantName: assistantNameInput.trim() }));
                                setEditingAssistantName(false);
                                success('Assistant name updated!');
                              }).catch(() => {
                                showError('Failed to update name');
                              });
                            }
                          } else if (e.key === 'Escape') {
                            setEditingAssistantName(false);
                            setAssistantNameInput(userProfile?.assistantName || 'AI Assistant');
                          }
                        }}
                        className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (user?.uid && assistantNameInput.trim()) {
                            updateAssistantName(user.uid, assistantNameInput.trim()).then(() => {
                              setUserProfile(prev => ({ ...prev, assistantName: assistantNameInput.trim() }));
                              setEditingAssistantName(false);
                              success('Assistant name updated!');
                            }).catch(() => {
                              showError('Failed to update name');
                            });
                          }
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Check size={16} className="text-green-400" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingAssistantName(false);
                          setAssistantNameInput(userProfile?.assistantName || 'AI Assistant');
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <X size={16} className="text-white/70" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-base sm:text-lg md:text-2xl font-bold text-white text-glow">
                        {userProfile?.assistantName || 'AI Help Assistant'}
                      </h2>
                      <button
                        onClick={() => setEditingAssistantName(true)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Rename Assistant"
                      >
                        <Edit2 size={14} className="text-white/60 hover:text-white" />
                      </button>
                    </>
                  )}
                  <Sparkles className="text-indigo-400 hidden sm:block" size={20} />
                  {import.meta.env.VITE_GEMINI_API_KEY?.trim() && (
                    <span className="px-2 py-1 bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 text-xs font-semibold rounded-full">
                      Gemini AI
                    </span>
                  )}
                  <span className="px-2 py-1 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border border-indigo-500/50 text-indigo-200 text-xs font-semibold rounded-full">
                    NEW
                  </span>
                </div>
                <p className="text-xs md:text-sm text-white/60 hidden sm:block">
                  {import.meta.env.VITE_GEMINI_API_KEY?.trim()
                    ? 'Intelligent AI: SISTC info, study tips & homework help in one place'
                    : 'Intelligent answers about SISTC courses, campuses, study tips & more'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
            {[
              { id: 'sistc', label: 'SISTC Info', icon: GraduationCap },
              { id: 'study-tips', label: 'Study Tips', icon: Lightbulb },
              { id: 'homework-help', label: 'Homework', icon: BookOpen }
            ].map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => {
                  // Don't reset messages if conversation has already started
                  if (messages.length > 1) {
                    setActiveTab(tab.id);
                    return; // Keep existing conversation
                  }
                  
                  // Only update greeting if it's still the default message
                  setActiveTab(tab.id);
                  const assistantName = userProfile?.assistantName || 'AI Assistant';
                  const userName = userProfile?.userName ? ` ${userProfile.userName}` : '';
                  
                  const greetings = {
                    'sistc': userName 
                      ? `Hello${userName}! I'm ${assistantName}. I can help you with information about courses, campuses, applications, and more.`
                      : `Hello! I'm ${assistantName}. I can help you with information about courses, campuses, applications, and more.`,
                    'study-tips': userName
                      ? `Hello${userName}! I'm ${assistantName}, your study coach! I can help you with time management, memory techniques, productivity tips, and effective learning strategies.`
                      : `I'm ${assistantName}, your study coach! I can help you with time management, memory techniques, productivity tips, and effective learning strategies.`,
                    'homework-help': userName
                      ? `Hello${userName}! I'm ${assistantName}, your homework tutor! I can help you understand concepts, solve problems, and clarify course material. How can I assist you today?`
                      : `I'm ${assistantName}, your homework tutor! I can help you understand concepts, solve problems, and clarify course material. How can I assist you today?`
                  };
                  
                  setMessages([{
                    id: 1,
                    type: 'bot',
                    content: greetings[tab.id],
                    timestamp: new Date()
                  }]);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </FadeIn>

      {/* Quick Questions - Fluid.so aesthetic */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel border-b border-white/10 px-4 md:px-6 py-2 md:py-3 flex-shrink-0"
      >
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {quickQuestions[activeTab]?.map((q, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleQuickQuestion(q.question)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 rounded-xl hover:bg-indigo-600/40 transition-all text-sm font-medium"
            >
              <q.icon size={16} />
              <span>{q.text}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Messages Area - Fluid.so aesthetic */}
      <StaggerContainer className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-3 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4" staggerDelay={0.05} initialDelay={0.2}>
        {messages.map((message, index) => (
          <StaggerItem key={message.id}>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'bot' && (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-2 bg-indigo-600/30 border border-indigo-500/50 rounded-full flex-shrink-0"
                >
                  <Bot className="text-indigo-300" size={20} />
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`max-w-[85%] sm:max-w-2xl px-3 md:px-4 py-2 md:py-3 rounded-xl ${
                  message.type === 'user'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'glass-panel text-white border border-white/10'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap text-white/90">
                  {formatMessage(message.content)}
                </div>
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-indigo-200' : 'text-white/60'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </motion.div>
              {message.type === 'user' && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="p-2 bg-white/10 border border-white/20 rounded-full flex-shrink-0"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-400"></div>
                </motion.div>
              )}
            </motion.div>
          </StaggerItem>
        ))}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="p-2 bg-indigo-600/30 border border-indigo-500/50 rounded-full"
              >
                <Bot className="text-indigo-300" size={20} />
              </motion.div>
              <div className="glass-panel border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader className="text-indigo-300" size={20} />
                  </motion.div>
                  <span className="text-sm text-white/70">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </StaggerContainer>

      {/* Input Area - Fluid.so aesthetic */}
      <FadeIn delay={0.25}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border-t border-white/10 px-3 md:px-6 py-3 md:py-4 rounded-b-[2rem] flex-shrink-0"
          style={{
            paddingBottom: `max(0.25rem, calc(env(safe-area-inset-bottom, 0px) * 0.3))`,
            paddingTop: `0.75rem`,
            paddingLeft: `calc(0.75rem + env(safe-area-inset-left, 0px))`,
            paddingRight: `calc(0.75rem + env(safe-area-inset-right, 0px))`
          }}
        >
          <form onSubmit={handleSend} className="flex gap-2 md:gap-3">
            <label htmlFor="ai-help-input" className="sr-only">Ask about SISTC</label>
            <input
              type="text"
              id="ai-help-input"
              name="ai-help-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about SISTC..."
              className="flex-1 px-3 md:px-4 py-2.5 text-sm md:text-base border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
              disabled={loading}
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              whileHover={(!loading && input.trim()) ? { scale: 1.05, y: -2 } : {}}
              whileTap={(!loading && input.trim()) ? { scale: 0.95 } : {}}
              className="send-button-shimmer text-white px-4 md:px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 font-medium shadow-lg hover:shadow-xl disabled:transform-none"
            >
              <Send size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">Send</span>
            </motion.button>
          </form>
          <p className="text-xs text-white/60 mt-2 text-center">
            {(() => {
              const hasGemini = !!(import.meta.env.VITE_GEMINI_API_KEY?.trim());
              if (hasGemini) {
                return (
                  <>
                    Intelligent AI: Google Gemini 2.5 Flash + SISTC Knowledge Base • 
                    <a href="https://sistc.edu.au/" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-indigo-200 hover:underline ml-1 transition-colors">sistc.edu.au</a>
                  </>
                );
              }
              return (
                <>
                  Powered by SISTC Knowledge Base • 
                  <a href="https://sistc.edu.au/" target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-indigo-200 hover:underline ml-1 transition-colors">sistc.edu.au</a>
                </>
              );
            })()}
          </p>
        </motion.div>
      </FadeIn>
    </div>
  );
};

export default AIHelp;
