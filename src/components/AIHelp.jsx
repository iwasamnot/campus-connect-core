import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Send, Bot, Loader, BookOpen, GraduationCap, MapPin, Phone, Mail, Calendar } from 'lucide-react';

// SISTC Knowledge Base - extracted from sistc.edu.au
const SISTC_KNOWLEDGE_BASE = {
  about: {
    story: "Sydney International School of Technology and Commerce (SISTC) opened its doors in 2020. We offer innovative courses designed to prepare students for careers in Information Technology.",
    focus: "SISTC focuses on providing quality IT education with industry partnerships and work-integrated learning opportunities.",
    locations: "SISTC has campuses in Sydney CBD, Parramatta, and Melbourne.",
    accreditation: "SISTC is an Accredited Institute of Higher Education. TEQSA PRV14311, CRICOS 03836J, ABN 746 130 55440"
  },
  courses: {
    undergraduate: [
      {
        name: "Bachelor of Information Technology",
        majors: ["Business Information Systems", "Digital Enterprise"],
        certified: "ACS Certified",
        nested: ["Diploma of Business Information Systems", "Diploma of Information Technology"]
      }
    ],
    postgraduate: [
      {
        name: "Master of Information Technology",
        specialisations: ["Data Analytics", "Digital Leadership", "Cyber Security Major"],
        certified: "ACS Certified",
        nested: ["Graduate Diploma in IT", "Graduate Certificate in IT"]
      }
    ]
  },
  locations: {
    sydney: {
      description: "Sydney CBD campus is located in the heart of Sydney's Central Business District (CBD), amidst cafes, shopping, and entertainment.",
      highlights: ["Iconic Landmarks at Sydney Harbour", "World-Class Shopping in CBD", "Diverse Dining Across the City"]
    },
    parramatta: {
      description: "Parramatta is a vibrant and rapidly growing city located in the heart of Greater Western Sydney.",
      highlights: ["Fantastic Shopping at Westfield Parramatta", "Global Cuisine on Church Street", "Historic Landmarks in Parramatta Park"]
    },
    melbourne: {
      description: "Melbourne is a vibrant city known for its trendy shopping, diverse dining, rich arts scene, beautiful parks, and world-class sporting events.",
      highlights: ["Trendy Shopping on Collins Street", "Laneway Cafés and Global Cuisine", "Iconic Arts and Music Festivals"]
    }
  },
  contact: {
    phone: "+61 (2) 9061 5900",
    website: "https://sistc.edu.au/",
    campuses: ["Sydney", "Parramatta", "Melbourne"]
  },
  statistics: {
    students: "500+ Students in Sydney & Melbourne",
    teaching: "85.1% rated Teaching Practices positively (National average: 79.8%)",
    support: "85.4% rated Support Services positively (National average: 72.7%)",
    development: "82.4% rated Skill Development positively (National average: 79.8%)"
  },
  applying: {
    requirements: "A Student visa is required for International Students. You must always follow the conditions of your visa.",
    process: "Entry Requirements, Credit for Prior Learning, Education Agents, How to Apply, Fees"
  },
  support: {
    services: "Student Support, Digital Library, Graduation support available",
    academic: "Academic Integrity, Work Integrated Learning, Capstone Projects Expo"
  }
};

// Simple keyword-based search and answer system
const findAnswer = (question) => {
  const lowerQuestion = question.toLowerCase();
  
  // Course-related questions
  if (lowerQuestion.includes('course') || lowerQuestion.includes('degree') || lowerQuestion.includes('program')) {
    if (lowerQuestion.includes('bachelor') || lowerQuestion.includes('undergraduate')) {
      const course = SISTC_KNOWLEDGE_BASE.courses.undergraduate[0];
      return `**${course.name}**\n\n**Majors Available:**\n${course.majors.map(m => `• ${m}`).join('\n')}\n\n**Certification:** ${course.certified}\n\n**Nested Courses (Exit Only):**\n${course.nested.map(n => `• ${n}`).join('\n')}\n\nFor more details, visit: ${SISTC_KNOWLEDGE_BASE.contact.website}`;
    }
    if (lowerQuestion.includes('master') || lowerQuestion.includes('postgraduate') || lowerQuestion.includes('graduate')) {
      const course = SISTC_KNOWLEDGE_BASE.courses.postgraduate[0];
      return `**${course.name}**\n\n**Specialisations Available:**\n${course.specialisations.map(s => `• ${s}`).join('\n')}\n\n**Certification:** ${course.certified}\n\n**Nested Courses (Exit Only):**\n${course.nested.map(n => `• ${n}`).join('\n')}\n\nFor more details, visit: ${SISTC_KNOWLEDGE_BASE.contact.website}`;
    }
    return `SISTC offers both undergraduate and postgraduate courses:\n\n**Undergraduate:**\n• Bachelor of Information Technology (with majors in Business Information Systems or Digital Enterprise)\n\n**Postgraduate:**\n• Master of Information Technology (with specialisations in Data Analytics, Digital Leadership, or Cyber Security)\n\nAll courses are ACS Certified. Visit ${SISTC_KNOWLEDGE_BASE.contact.website} for detailed information.`;
  }

  // Location questions
  if (lowerQuestion.includes('location') || lowerQuestion.includes('campus') || lowerQuestion.includes('where')) {
    if (lowerQuestion.includes('sydney')) {
      const loc = SISTC_KNOWLEDGE_BASE.locations.sydney;
      return `**Sydney Campus**\n\n${loc.description}\n\n**Highlights:**\n${loc.highlights.map(h => `• ${h}`).join('\n')}\n\nContact: ${SISTC_KNOWLEDGE_BASE.contact.phone}`;
    }
    if (lowerQuestion.includes('parramatta')) {
      const loc = SISTC_KNOWLEDGE_BASE.locations.parramatta;
      return `**Parramatta Campus**\n\n${loc.description}\n\n**Highlights:**\n${loc.highlights.map(h => `• ${h}`).join('\n')}\n\nContact: ${SISTC_KNOWLEDGE_BASE.contact.phone}`;
    }
    if (lowerQuestion.includes('melbourne')) {
      const loc = SISTC_KNOWLEDGE_BASE.locations.melbourne;
      return `**Melbourne Campus**\n\n${loc.description}\n\n**Highlights:**\n${loc.highlights.map(h => `• ${h}`).join('\n')}\n\nContact: ${SISTC_KNOWLEDGE_BASE.contact.phone}`;
    }
    return `SISTC has three campus locations:\n\n**1. Sydney CBD** - Heart of Sydney's CBD\n**2. Parramatta** - Greater Western Sydney\n**3. Melbourne** - Vibrant city with arts and culture\n\nFor specific campus information, visit: ${SISTC_KNOWLEDGE_BASE.contact.website}`;
  }

  // Contact questions
  if (lowerQuestion.includes('contact') || lowerQuestion.includes('phone') || lowerQuestion.includes('email') || lowerQuestion.includes('reach')) {
    return `**Contact SISTC**\n\n**Phone:** ${SISTC_KNOWLEDGE_BASE.contact.phone}\n**Website:** ${SISTC_KNOWLEDGE_BASE.contact.website}\n**Campuses:** ${SISTC_KNOWLEDGE_BASE.contact.campuses.join(', ')}\n\nFor general enquiries, visit the Contact page on our website.`;
  }

  // Application questions
  if (lowerQuestion.includes('apply') || lowerQuestion.includes('admission') || lowerQuestion.includes('enroll') || lowerQuestion.includes('enrolment')) {
    return `**Applying to SISTC**\n\n${SISTC_KNOWLEDGE_BASE.applying.requirements}\n\n**Application Process Includes:**\n• Entry Requirements\n• Credit for Prior Learning\n• Education Agents\n• How to Apply\n• Fees Information\n\nVisit ${SISTC_KNOWLEDGE_BASE.contact.website} for detailed application information.`;
  }

  // About questions
  if (lowerQuestion.includes('about') || lowerQuestion.includes('what is sistc') || lowerQuestion.includes('who')) {
    return `**About SISTC**\n\n${SISTC_KNOWLEDGE_BASE.about.story}\n\n${SISTC_KNOWLEDGE_BASE.about.focus}\n\n**Accreditation:** ${SISTC_KNOWLEDGE_BASE.about.accreditation}\n\n**Locations:** ${SISTC_KNOWLEDGE_BASE.about.locations}`;
  }

  // Support questions
  if (lowerQuestion.includes('support') || lowerQuestion.includes('help') || lowerQuestion.includes('service')) {
    return `**Student Support Services**\n\n${SISTC_KNOWLEDGE_BASE.support.services}\n\n**Academic Support:**\n${SISTC_KNOWLEDGE_BASE.support.academic}\n\nContact: ${SISTC_KNOWLEDGE_BASE.contact.phone} or visit ${SISTC_KNOWLEDGE_BASE.contact.website}`;
  }

  // Statistics/ratings
  if (lowerQuestion.includes('rating') || lowerQuestion.includes('statistic') || lowerQuestion.includes('review') || lowerQuestion.includes('feedback')) {
    return `**Student Feedback & Statistics**\n\n${SISTC_KNOWLEDGE_BASE.statistics.students}\n\n**Teaching Practices:** ${SISTC_KNOWLEDGE_BASE.statistics.teaching}\n**Support Services:** ${SISTC_KNOWLEDGE_BASE.statistics.support}\n**Skill Development:** ${SISTC_KNOWLEDGE_BASE.statistics.development}\n\n*Based on Undergraduate Student Experience Survey 2021-2022*`;
  }

  // Fees
  if (lowerQuestion.includes('fee') || lowerQuestion.includes('cost') || lowerQuestion.includes('price') || lowerQuestion.includes('tuition')) {
    return `**Fees & Charges**\n\nFor detailed information about fees and charges, please visit the Fees section on our website: ${SISTC_KNOWLEDGE_BASE.contact.website}\n\nYou can also contact us directly at ${SISTC_KNOWLEDGE_BASE.contact.phone} for fee-related enquiries.`;
  }

  // Default response
  return `I can help you with information about SISTC! Here are some topics I can answer:\n\n• **Courses** - Bachelor and Master programs\n• **Locations** - Sydney, Parramatta, Melbourne campuses\n• **Contact** - Phone, email, and campus locations\n• **Application** - How to apply and entry requirements\n• **Support** - Student services and support\n• **About** - SISTC history and accreditation\n\nTry asking: "What courses do you offer?" or "Where are your campuses?"\n\nFor more detailed information, visit: ${SISTC_KNOWLEDGE_BASE.contact.website}`;
};

const AIHelp = () => {
  const { darkMode } = useTheme();
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm the SISTC AI Assistant. I can help you with information about courses, campuses, applications, and more. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setInput('');
    setLoading(true);

    // Simulate AI processing delay
    setTimeout(() => {
      try {
        const answer = findAnswer(input.trim());
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: answer,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (err) {
        showError('Failed to get response. Please try again.');
        console.error('AI Error:', err);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const quickQuestions = [
    { icon: GraduationCap, text: "What courses do you offer?", question: "What courses do you offer?" },
    { icon: MapPin, text: "Where are your campuses?", question: "Where are your campuses located?" },
    { icon: Phone, text: "How can I contact you?", question: "How can I contact SISTC?" },
    { icon: BookOpen, text: "How do I apply?", question: "How do I apply to SISTC?" }
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
    // Trigger send after a brief delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    }, 100);
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={idx} className="font-bold text-indigo-600 dark:text-indigo-400">{line.slice(2, -2)}</strong>;
      }
      if (line.startsWith('•')) {
        return <div key={idx} className="ml-4">{line}</div>;
      }
      if (line.trim() === '') {
        return <br key={idx} />;
      }
      return <div key={idx}>{line}</div>;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <Bot className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Help Assistant</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Get answers about SISTC courses, campuses, and more</p>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex flex-wrap gap-2">
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
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
              className={`max-w-2xl px-4 py-3 rounded-lg ${
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
              <Loader className="animate-spin text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about SISTC..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            <span>Send</span>
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Information sourced from <a href="https://sistc.edu.au/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">sistc.edu.au</a>
        </p>
      </div>
    </div>
  );
};

export default AIHelp;

