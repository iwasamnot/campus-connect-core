/**
 * PDF Ingestion Pipeline for RAG System
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * RESEARCH VALUE: "Multi-Format Unstructured Data Ingestion"
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script implements a production-grade PDF ingestion pipeline:
 * 1. Downloads official PDF documents from SISTC website
 * 2. Extracts and cleans text content
 * 3. Splits into semantic chunks (preserving sentence boundaries)
 * 4. Generates embeddings using Gemini text-embedding-004
 * 5. Upserts to Pinecone with rich metadata
 * 
 * Academic Citation:
 * "The system implements a Multi-Format Ingestion Pipeline capable of parsing
 * unstructured binary documents (PDFs), extracting semantic content via OCR-free
 * text extraction, applying intelligent chunking strategies to preserve context,
 * and indexing the resulting vectors for efficient retrieval."
 * 
 * Usage:
 *   npm run pdf:upload
 *   node scripts/uploadPdf.js
 * 
 * Environment Variables:
 *   - PINECONE_API_KEY: Your Pinecone API key
 *   - PINECONE_INDEX_NAME: Target index name (default: campus-connect-index)
 *   - GEMINI_API_KEY: Google Gemini API key for embeddings
 */

import axios from 'axios';
import pdf from 'pdf-parse';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

// Load environment variables
config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || process.env.VITE_PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || process.env.VITE_PINECONE_INDEX_NAME || 'campus-connect-index';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

// Embedding configuration
const EMBEDDING_MODEL = 'text-embedding-004';
const CHUNK_SIZE = 800;        // Characters per chunk
const CHUNK_OVERLAP = 100;     // Overlap between chunks for context continuity
const BATCH_SIZE = 50;         // Vectors per upsert batch

// PDF Sources - Official SISTC Documents
const PDF_SOURCES = [
  {
    url: 'https://sistc.edu.au/wp-content/uploads/Student-Handbook-2024-Web.pdf',
    title: 'SISTC Student Handbook 2024',
    category: 'handbook',
    description: 'Comprehensive guide for students including policies, procedures, and campus information'
  },
  {
    url: 'https://sistc.edu.au/wp-content/uploads/2021/12/SISTC_Academic-Integrity-and-Misconduct-Policy-and-Procedure_02.00_20230416.pdf',
    title: 'Academic Integrity and Misconduct Policy',
    category: 'policy',
    description: 'Official policy on plagiarism, cheating, and academic misconduct penalties'
  },
  {
    url: 'https://sistc.edu.au/wp-content/uploads/2024/08/SISTC_Acceptable-Use-of-ICT-Resources-Policy_03.00-20240411.pdf',
    title: 'ICT Acceptable Use Policy',
    category: 'policy',
    description: 'Guidelines for using university IT resources, Wi-Fi, and computer facilities'
  },
  {
    url: 'https://sistc.edu.au/wp-content/uploads/2021/12/SISTC_Assessment-Policy-and-Procedure_03.00_20230824.pdf',
    title: 'Assessment Policy and Procedure',
    category: 'policy',
    description: 'Rules for assignments, exams, grading, and special consideration'
  },
  {
    url: 'https://sistc.edu.au/wp-content/uploads/2021/12/SISTC_Student-Complaints-and-Appeals-Policy-and-Procedure_02.00_20230416.pdf',
    title: 'Student Complaints and Appeals Policy',
    category: 'policy',
    description: 'Process for lodging complaints and appealing academic decisions'
  },
  {
    url: 'https://sistc.edu.au/wp-content/uploads/2021/12/SISTC_Student-Code-of-Conduct_02.00_20230416.pdf',
    title: 'Student Code of Conduct',
    category: 'policy',
    description: 'Expected behavior standards and disciplinary procedures'
  }
];

// ============================================================================
// VALIDATION
// ============================================================================

function validateEnvironment() {
  const errors = [];
  
  if (!PINECONE_API_KEY) {
    errors.push('PINECONE_API_KEY (or VITE_PINECONE_API_KEY) is not set');
  }
  
  if (!GEMINI_API_KEY) {
    errors.push('GEMINI_API_KEY (or VITE_GEMINI_API_KEY) is not set');
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  console.log(`   Index: ${PINECONE_INDEX_NAME}`);
}

// ============================================================================
// TEXT PROCESSING
// ============================================================================

/**
 * Clean extracted PDF text
 * Removes excessive whitespace, headers/footers, and normalizes formatting
 */
function cleanText(text) {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove page numbers (common patterns)
    .replace(/Page \d+ of \d+/gi, '')
    .replace(/^\d+\s*$/gm, '')
    // Remove common header/footer patterns
    .replace(/Sydney International School of Technology and Commerce/gi, 'SISTC')
    // Clean up hyphenated words split across lines
    .replace(/(\w)-\s+(\w)/g, '$1$2')
    // Remove excessive punctuation
    .replace(/\.{3,}/g, '...')
    // Trim
    .trim();
}

/**
 * Split text into semantic chunks
 * Preserves sentence boundaries and includes overlap for context
 */
function chunkText(text, maxLength = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  
  // Split by sentences (handles . ? ! followed by space and capital letter)
  const sentences = text
    .replace(/([.?!])\s+(?=[A-Z])/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let previousChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // If adding this sentence exceeds max length, save current chunk
    if (currentChunk.length + trimmedSentence.length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap from previous
      previousChunk = currentChunk;
      const overlapText = previousChunk.slice(-overlap);
      currentChunk = overlapText + ' ' + trimmedSentence + ' ';
    } else {
      currentChunk += trimmedSentence + ' ';
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim().length > 50) { // Minimum chunk size
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Generate a descriptive title for a chunk based on its content
 */
function generateChunkTitle(chunk, docTitle, chunkIndex) {
  // Try to extract a meaningful title from the first sentence
  const firstSentence = chunk.split(/[.?!]/)[0];
  if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
    return `${docTitle} - ${firstSentence.trim()}`;
  }
  return `${docTitle} - Section ${chunkIndex + 1}`;
}

// ============================================================================
// PDF PROCESSING
// ============================================================================

/**
 * Download PDF from URL and extract text
 */
async function downloadAndParsePdf(url) {
  try {
    console.log(`   📥 Downloading from ${url.substring(0, 60)}...`);
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SISTC-RAG-Bot/1.0)'
      }
    });
    
    const buffer = Buffer.from(response.data);
    console.log(`   📄 Downloaded ${(buffer.length / 1024).toFixed(1)} KB`);
    
    const data = await pdf(buffer);
    console.log(`   📝 Extracted ${data.numpages} pages, ${data.text.length} characters`);
    
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error(`   ❌ Failed to process PDF: ${error.message}`);
    return null;
  }
}

// ============================================================================
// EMBEDDING & UPLOAD
// ============================================================================

/**
 * Generate embedding for text using Gemini
 */
async function generateEmbedding(genAI, text) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Upsert vectors to Pinecone in batches
 */
async function batchUpsert(index, vectors) {
  const batches = [];
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    batches.push(vectors.slice(i, i + BATCH_SIZE));
  }
  
  let totalUpserted = 0;
  for (let i = 0; i < batches.length; i++) {
    await index.upsert(batches[i]);
    totalUpserted += batches[i].length;
    console.log(`   📤 Batch ${i + 1}/${batches.length}: Upserted ${batches[i].length} vectors`);
    
    // Small delay between batches to avoid rate limits
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return totalUpserted;
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

async function runPdfIngestionPipeline() {
  console.log('🚀 PDF Ingestion Pipeline for RAG System');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Validate environment
  validateEnvironment();
  
  // Initialize clients
  const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const index = pinecone.index(PINECONE_INDEX_NAME);
  
  console.log('✅ Pinecone and Gemini clients initialized\n');
  
  // Process statistics
  const stats = {
    documentsProcessed: 0,
    documentsFailed: 0,
    totalChunks: 0,
    totalVectors: 0,
    totalCharacters: 0
  };
  
  // Process each PDF
  for (const doc of PDF_SOURCES) {
    console.log(`\n📚 Processing: ${doc.title}`);
    console.log(`   Category: ${doc.category}`);
    
    // Download and parse
    const pdfData = await downloadAndParsePdf(doc.url);
    
    if (!pdfData) {
      stats.documentsFailed++;
      continue;
    }
    
    // Clean and chunk text
    const cleanedText = cleanText(pdfData.text);
    const chunks = chunkText(cleanedText);
    
    console.log(`   ✂️ Split into ${chunks.length} semantic chunks`);
    stats.totalChunks += chunks.length;
    stats.totalCharacters += cleanedText.length;
    
    // Generate embeddings and create vectors
    const vectors = [];
    console.log(`   🧮 Generating embeddings...`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const embedding = await generateEmbedding(genAI, chunk);
        
        vectors.push({
          id: `pdf_${doc.category}_${doc.title.replace(/\s+/g, '_').substring(0, 30)}_${i}`,
          values: embedding,
          metadata: {
            text: chunk,
            title: generateChunkTitle(chunk, doc.title, i),
            category: doc.category,
            source: 'Official PDF Document',
            sourceUrl: doc.url,
            documentTitle: doc.title,
            description: doc.description,
            chunkIndex: i,
            totalChunks: chunks.length,
            type: 'pdf_chunk'
          }
        });
        
        // Progress indicator
        if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
          process.stdout.write(`\r   🧮 Embedded ${i + 1}/${chunks.length} chunks`);
        }
        
        // Rate limiting
        if ((i + 1) % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`\n   ⚠️ Failed to embed chunk ${i}: ${error.message}`);
      }
    }
    
    console.log(''); // New line after progress
    
    // Upload to Pinecone
    if (vectors.length > 0) {
      const upserted = await batchUpsert(index, vectors);
      stats.totalVectors += upserted;
      stats.documentsProcessed++;
      console.log(`   ✅ Uploaded ${upserted} vectors for ${doc.title}`);
    }
  }
  
  // Final summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 PDF Ingestion Pipeline Complete!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   📚 Documents Processed: ${stats.documentsProcessed}/${PDF_SOURCES.length}`);
  if (stats.documentsFailed > 0) {
    console.log(`   ⚠️ Documents Failed: ${stats.documentsFailed}`);
  }
  console.log(`   ✂️ Total Chunks: ${stats.totalChunks}`);
  console.log(`   📤 Total Vectors: ${stats.totalVectors}`);
  console.log(`   📝 Total Characters: ${stats.totalCharacters.toLocaleString()}`);
  console.log(`   🗄️ Index: ${PINECONE_INDEX_NAME}`);
  
  // Verify upload
  console.log('\n🔍 Verifying upload...');
  try {
    const indexStats = await index.describeIndexStats();
    console.log(`   Total vectors in index: ${indexStats.totalRecordCount || 'N/A'}`);
  } catch (error) {
    console.warn(`   ⚠️ Could not verify: ${error.message}`);
  }
  
  console.log('\n✅ You can now ask questions about SISTC policies!');
  console.log('   Examples:');
  console.log('   - "What is the penalty for plagiarism?"');
  console.log('   - "Can I use university Wi-Fi for gaming?"');
  console.log('   - "How do I appeal a grade?"');
}

// Run the pipeline
runPdfIngestionPipeline().catch(error => {
  console.error('\n❌ Pipeline failed:', error);
  process.exit(1);
});
