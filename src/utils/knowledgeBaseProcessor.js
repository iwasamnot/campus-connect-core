/**
 * Knowledge Base Processor
 * Converts the SISTC knowledge base into document chunks with embeddings for RAG
 */

import { KnowledgeDocument } from './ragRetrieval';
import { generateEmbedding } from './ragEmbeddings';

/**
 * SISTC Knowledge Base (existing structure)
 */
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

/**
 * Process knowledge base into document chunks
 */
export const processKnowledgeBase = () => {
  const documents = [];
  let docId = 0;

  // About section
  Object.entries(SISTC_KNOWLEDGE_BASE.about).forEach(([key, value]) => {
    documents.push(new KnowledgeDocument({
      id: `about-${key}-${docId++}`,
      text: `About SISTC - ${key}: ${value}`,
      metadata: {
        category: 'about',
        subcategory: key,
        title: `About SISTC: ${key}`
      }
    }));
  });

  // Courses - Undergraduate
  SISTC_KNOWLEDGE_BASE.courses.undergraduate.forEach((course, idx) => {
    const courseText = `Undergraduate Course: ${course.name}. ${course.description} Duration: ${course.duration}. ${course.certified}. Majors: ${course.majors.join(', ')}. Nested qualifications: ${course.nested.join(', ')}.`;
    documents.push(new KnowledgeDocument({
      id: `course-ug-${idx}`,
      text: courseText,
      metadata: {
        category: 'courses',
        subcategory: 'undergraduate',
        title: course.name,
        type: 'undergraduate'
      }
    }));
  });

  // Courses - Postgraduate
  SISTC_KNOWLEDGE_BASE.courses.postgraduate.forEach((course, idx) => {
    const courseText = `Postgraduate Course: ${course.name}. ${course.description} Duration: ${course.duration}. ${course.certified}. Specialisations: ${course.specialisations.join(', ')}. Nested qualifications: ${course.nested.join(', ')}.`;
    documents.push(new KnowledgeDocument({
      id: `course-pg-${idx}`,
      text: courseText,
      metadata: {
        category: 'courses',
        subcategory: 'postgraduate',
        title: course.name,
        type: 'postgraduate'
      }
    }));
  });

  // Locations
  Object.entries(SISTC_KNOWLEDGE_BASE.locations).forEach(([city, info]) => {
    const locationText = `${city} Campus: ${info.description} Address: ${info.address}. Highlights: ${info.highlights.join(', ')}.`;
    documents.push(new KnowledgeDocument({
      id: `location-${city}`,
      text: locationText,
      metadata: {
        category: 'locations',
        subcategory: city,
        title: `${city} Campus`,
        address: info.address
      }
    }));
  });

  // Contact
  const contactText = `Contact Information: Phone: ${SISTC_KNOWLEDGE_BASE.contact.phone}. Website: ${SISTC_KNOWLEDGE_BASE.contact.website}. Email: ${SISTC_KNOWLEDGE_BASE.contact.email}. Campuses: ${SISTC_KNOWLEDGE_BASE.contact.campuses.join(', ')}.`;
  documents.push(new KnowledgeDocument({
    id: 'contact-info',
    text: contactText,
    metadata: {
      category: 'contact',
      title: 'Contact Information'
    }
  }));

  // Statistics
  const statsText = `SISTC Statistics: ${SISTC_KNOWLEDGE_BASE.statistics.students}. Teaching: ${SISTC_KNOWLEDGE_BASE.statistics.teaching}. Support: ${SISTC_KNOWLEDGE_BASE.statistics.support}. Development: ${SISTC_KNOWLEDGE_BASE.statistics.development}. ${SISTC_KNOWLEDGE_BASE.statistics.survey}.`;
  documents.push(new KnowledgeDocument({
    id: 'statistics',
    text: statsText,
    metadata: {
      category: 'statistics',
      title: 'SISTC Statistics'
    }
  }));

  // Applying
  const applyText = `Application Process: ${SISTC_KNOWLEDGE_BASE.applying.requirements}. Process includes: ${SISTC_KNOWLEDGE_BASE.applying.process}. Steps: ${SISTC_KNOWLEDGE_BASE.applying.steps.join('. ')}.`;
  documents.push(new KnowledgeDocument({
    id: 'applying',
    text: applyText,
    metadata: {
      category: 'applying',
      title: 'How to Apply'
    }
  }));

  // Support
  const supportText = `Student Support Services: ${SISTC_KNOWLEDGE_BASE.support.services}. Academic: ${SISTC_KNOWLEDGE_BASE.support.academic}. Wellbeing: ${SISTC_KNOWLEDGE_BASE.support.wellbeing}. Library: ${SISTC_KNOWLEDGE_BASE.support.library}.`;
  documents.push(new KnowledgeDocument({
    id: 'support',
    text: supportText,
    metadata: {
      category: 'support',
      title: 'Student Support Services'
    }
  }));

  // Student Life
  const lifeText = `Student Life: ${SISTC_KNOWLEDGE_BASE.life.studentLife}. ${SISTC_KNOWLEDGE_BASE.life.womenInIT}. ${SISTC_KNOWLEDGE_BASE.life.capstone}. ${SISTC_KNOWLEDGE_BASE.life.workIntegrated}.`;
  documents.push(new KnowledgeDocument({
    id: 'student-life',
    text: lifeText,
    metadata: {
      category: 'life',
      title: 'Student Life at SISTC'
    }
  }));

  return documents;
};

/**
 * Generate embeddings for all documents (can be done lazily or in bulk)
 */
export const generateDocumentEmbeddings = async (documents, batchSize = 5) => {
  const documentsWithEmbeddings = [];
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const embeddings = await Promise.all(
      batch.map(doc => generateEmbedding(doc.text))
    );
    
    batch.forEach((doc, idx) => {
      const embedding = embeddings[idx];
      documentsWithEmbeddings.push({
        ...doc,
        embedding: embedding || doc.embedding
      });
    });
    
    // Rate limiting delay
    if (i + batchSize < documents.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return documentsWithEmbeddings;
};
