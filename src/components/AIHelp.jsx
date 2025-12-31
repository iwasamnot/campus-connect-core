import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Send, Bot, Loader, BookOpen, GraduationCap, MapPin, Phone, Mail, Calendar, Sparkles } from 'lucide-react';
import { AI_CONFIG } from '../config/aiConfig';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Debug: Log API key status (remove in production)
if (import.meta.env.DEV) {
  console.log('AI Config Status:', {
    hasOpenAI: !!AI_CONFIG.openaiApiKey && AI_CONFIG.openaiApiKey.trim() !== '',
    openaiLength: AI_CONFIG.openaiApiKey?.length || 0,
    hasGemini: !!(import.meta.env.VITE_GEMINI_API_KEY?.trim()),
    geminiLength: import.meta.env.VITE_GEMINI_API_KEY?.trim()?.length || 0,
    geminiKeyPreview: import.meta.env.VITE_GEMINI_API_KEY?.trim() ? import.meta.env.VITE_GEMINI_API_KEY.trim().substring(0, 10) + '...' : 'not set'
  });
}

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
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm the SISTC AI Assistant. I can help you with information about courses, campuses, applications, requirements, fees, and more. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGeminiModel, setSelectedGeminiModel] = useState('gemini-pro'); // Default model
  const messagesEndRef = useRef(null);
  const ai = useRef(new IntelligentAI());

  // Available Gemini models
  const geminiModels = [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Free - Fast & Efficient (Recommended)', free: true },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B', description: 'Free - Lightweight & Fast', free: true },
    { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro', description: 'Paid - Most Capable', free: false },
    { value: 'gemini-pro', label: 'Gemini Pro', description: 'Paid - Standard Model', free: false },
  ];

  // Initialize Gemini AI with selected model
  const getGeminiModel = (modelName = selectedGeminiModel) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === '') {
      return null;
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
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
        systemInstruction: 'You are a helpful AI assistant for Sydney International School of Technology and Commerce (SISTC). You provide accurate, helpful information about SISTC courses, campuses, applications, and student services. Be concise, friendly, and professional. Format your responses with markdown for better readability.',
      });
      return model;
    } catch (error) {
      console.error('Error initializing Gemini:', error);
      return null;
    }
  };

  // Call Gemini AI
  const callGemini = async (question, localContext) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === '') {
      console.warn('AIHelp: Gemini API key not found in callGemini');
      return null;
    }

    const model = getGeminiModel(selectedGeminiModel);
    if (!model) {
      console.warn('AIHelp: Gemini model not available after initialization');
      return null;
    }

    try {
      const prompt = `You are a helpful AI assistant for Sydney International School of Technology and Commerce (SISTC). 
You provide accurate, helpful information about SISTC courses, campuses, applications, and student services.

Use the following local knowledge base information as reference:
${localContext ? `\n${localContext}\n` : ''}

If the question is about SISTC specifically, prioritize and use the knowledge base information provided above.
For general questions or if the knowledge base doesn't have the answer, use your general knowledge.
Be concise, friendly, and professional. Format your responses with markdown for better readability.

Question: ${question}`;

      console.log('AIHelp: Calling Gemini with model:', selectedGeminiModel);
      console.log('AIHelp: Question length:', question.length);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('AIHelp: Gemini response received, length:', text?.length || 0);
      if (text && text.trim()) {
        console.log('AIHelp: ✅ Gemini response preview:', text.substring(0, 150) + '...');
        return text.trim();
      } else {
        console.warn('AIHelp: ⚠️ Gemini returned empty text');
        return null;
      }
    } catch (error) {
      console.error('AIHelp: ❌ Error calling Gemini:', error);
      console.error('AIHelp: Error name:', error.name);
      console.error('AIHelp: Error message:', error.message);
      if (error.stack) {
        console.error('AIHelp: Error stack:', error.stack);
      }
      // Return null instead of throwing so it can fall back gracefully
      return null;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // Hybrid AI: Try Gemini first, then ChatGPT, then fallback to local knowledge base
  const getHybridAIResponse = async (question) => {
    // Always get local knowledge base answer first for context
    const localAnswer = ai.current.processQuestion(question);
    
    // Priority 1: Try Gemini if API key is available
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
    console.log('AIHelp: Checking Gemini API key...', {
      hasKey: !!geminiApiKey,
      keyLength: geminiApiKey?.length || 0,
      keyPreview: geminiApiKey ? geminiApiKey.substring(0, 10) + '...' : 'not set'
    });
    
    if (geminiApiKey && geminiApiKey !== '') {
      console.log('AIHelp: Attempting to use Gemini AI with model:', selectedGeminiModel);
      const geminiAnswer = await callGemini(question, localAnswer);
      if (geminiAnswer && geminiAnswer.trim() !== '') {
        console.log('AIHelp: ✅ Gemini AI response received successfully, length:', geminiAnswer.length);
        console.log('AIHelp: ✅ Using Gemini response (not falling back)');
        return geminiAnswer; // Return Gemini answer if successful
      } else {
        console.warn('AIHelp: ⚠️ Gemini returned empty or null response, falling back to ChatGPT or local...');
      }
    } else {
      console.log('AIHelp: ⚠️ Gemini API key not found, skipping Gemini and trying ChatGPT or local...');
    }
    
    // Priority 2: Try ChatGPT if API key is available
    if (AI_CONFIG.openaiApiKey && AI_CONFIG.openaiApiKey.trim() !== '') {
      try {
        const systemPrompt = `You are a helpful AI assistant for Sydney International School of Technology and Commerce (SISTC). 
You provide accurate, helpful information about SISTC courses, campuses, applications, and student services.

Use the following local knowledge base information as reference:
${localAnswer ? `\n${localAnswer}\n` : ''}

If the question is about SISTC specifically, prioritize and use the knowledge base information provided above.
For general questions or if the knowledge base doesn't have the answer, use your general knowledge.
Be concise, friendly, and professional. Format your responses with markdown for better readability.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...ai.current.context.slice(-3).map(ctx => ({
            role: 'user',
            content: ctx.question
          })),
          { role: 'user', content: question }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.openaiApiKey}`
          },
          body: JSON.stringify({
            model: AI_CONFIG.model || 'gpt-4o-mini',
            messages: messages,
            temperature: AI_CONFIG.temperature,
            max_tokens: AI_CONFIG.maxTokens
          })
        });

        if (response.ok) {
          const data = await response.json();
          const chatGPTAnswer = data.choices[0]?.message?.content || null;
          if (chatGPTAnswer) {
            return chatGPTAnswer; // Return ChatGPT answer if successful
          }
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
        // Fall through to local answer
      }
    }
    
    // Fallback to local knowledge base answer
    return localAnswer;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const question = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Use hybrid model: Gemini first, then ChatGPT, then local knowledge base
      console.log('AIHelp: Getting AI response for question:', question);
      const answer = await getHybridAIResponse(question);

      if (!answer || answer.trim() === '') {
        console.warn('AIHelp: No answer generated, using fallback');
        throw new Error('No answer generated');
      }

      console.log('AIHelp: Using AI response, length:', answer.length);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: answer,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('AIHelp: AI Error:', err);
      console.error('AIHelp: Error details:', err.message);
      
      // Final fallback to local knowledge base
      try {
        console.log('AIHelp: Using local knowledge base fallback');
        const fallbackAnswer = ai.current.processQuestion(question);
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: fallbackAnswer || "I apologize, but I'm having trouble accessing my knowledge base right now. Please try again later or contact SISTC directly at +61 (2) 9061 5900 or visit https://sistc.edu.au/",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (fallbackErr) {
        console.error('AIHelp: Fallback error:', fallbackErr);
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

  const quickQuestions = [
    { icon: GraduationCap, text: "What courses do you offer?", question: "What courses do you offer?" },
    { icon: MapPin, text: "Where are your campuses?", question: "Where are your campuses located?" },
    { icon: Phone, text: "How can I contact you?", question: "How can I contact SISTC?" },
    { icon: BookOpen, text: "How do I apply?", question: "What is the application process?" },
    { icon: Calendar, text: "What are the entry requirements?", question: "What are the entry requirements for the Bachelor program?" }
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    }, 100);
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
          <strong key={`bold-${key++}`} className="font-bold text-indigo-600 dark:text-indigo-400">
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4"
        style={{
          paddingTop: `max(0.75rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          paddingBottom: `0.75rem`,
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex-shrink-0">
              <Bot className="text-indigo-600 dark:text-indigo-400 md:w-6 md:h-6" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800 dark:text-white">AI Help Assistant</h2>
                <Sparkles className="text-indigo-500 hidden sm:block" size={20} />
                {AI_CONFIG.openaiApiKey && AI_CONFIG.openaiApiKey.trim() !== '' && (
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full">
                    ChatGPT
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                {AI_CONFIG.openaiApiKey && AI_CONFIG.openaiApiKey.trim() !== ''
                  ? 'Hybrid AI: Powered by ChatGPT enhanced with SISTC knowledge base'
                  : 'Intelligent answers about SISTC courses, campuses, and more'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-2 md:py-3">
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(q.question)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm"
            >
              <q.icon size={16} />
              <span>{q.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-3 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.type === 'bot' && (
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full flex-shrink-0">
                <Bot className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-2xl px-3 md:px-4 py-2 md:py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {formatMessage(message.content)}
              </div>
              <div className={`text-xs mt-2 ${
                message.type === 'user' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.type === 'user' && (
              <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
              <Bot className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader className="animate-spin text-indigo-600 dark:text-indigo-400" size={20} />
                <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div 
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4"
        style={{
          paddingBottom: `max(0.25rem, calc(env(safe-area-inset-bottom, 0px) * 0.3))`,
          paddingTop: `0.75rem`,
          paddingLeft: `calc(0.75rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(0.75rem + env(safe-area-inset-right, 0px))`
        }}
      >
        <form onSubmit={handleSend} className="flex gap-2 md:gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about SISTC..."
            className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
          >
            <Send size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {(() => {
            const hasGemini = !!(import.meta.env.VITE_GEMINI_API_KEY?.trim());
            const hasOpenAI = AI_CONFIG.openaiApiKey && AI_CONFIG.openaiApiKey.trim() !== '';
            if (hasGemini) {
              return (
                <>
                  Hybrid AI: Gemini ({geminiModels.find(m => m.value === selectedGeminiModel)?.label}) + SISTC Knowledge Base • 
                  <a href="https://sistc.edu.au/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1">sistc.edu.au</a>
                </>
              );
            } else if (hasOpenAI) {
              return (
                <>
                  Hybrid AI: ChatGPT + SISTC Knowledge Base • 
                  <a href="https://sistc.edu.au/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1">sistc.edu.au</a>
                </>
              );
            }
            return (
              <>
                Powered by SISTC Knowledge Base • 
                <a href="https://sistc.edu.au/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1">sistc.edu.au</a>
              </>
            );
          })()}
        </p>
      </div>
    </div>
  );
};

export default AIHelp;
