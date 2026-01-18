# RAG (Retrieval-Augmented Generation) Setup Guide

This guide explains the RAG system implementation in CampusConnect, which enhances the AI Help Assistant with intelligent document retrieval.

## Overview

The RAG system combines:
- **Retrieval**: Finds relevant documents from the knowledge base using semantic similarity
- **Augmentation**: Enhances AI responses with retrieved context
- **Generation**: Uses Gemini AI to generate context-aware responses

## Architecture

```
User Query
    ↓
[RAG Retrieval] → Find relevant documents (vector similarity)
    ↓
[Context Formatting] → Format retrieved documents
    ↓
[Gemini AI] → Generate response with context
    ↓
Response to User
```

## Components

### 1. `src/utils/ragEmbeddings.js`
- Generates vector embeddings for text
- Calculates cosine similarity between vectors
- Uses hash-based embeddings (lightweight, works without external APIs)

### 2. `src/utils/ragRetrieval.js`
- Retrieves relevant documents using vector similarity
- Formats context for AI generation
- Supports keyword fallback

### 3. `src/utils/knowledgeBaseProcessor.js`
- Processes SISTC knowledge base into document chunks
- Structures documents with metadata
- Creates searchable document collection

### 4. `src/utils/ragSystem.js`
- Main RAG integration
- Combines retrieval and generation
- Provides unified API for RAG queries

## How It Works

1. **Knowledge Base Processing**: The SISTC knowledge base is processed into searchable document chunks
2. **Query Processing**: User queries are converted to embeddings
3. **Document Retrieval**: System finds most relevant documents using similarity search
4. **Context Building**: Retrieved documents are formatted into context
5. **AI Generation**: Gemini AI generates response using retrieved context

## Features

- ✅ **Semantic Search**: Finds relevant documents based on meaning, not just keywords
- ✅ **Context-Aware**: Uses retrieved documents to provide accurate answers
- ✅ **Fallback Support**: Falls back to keyword search if embeddings fail
- ✅ **Integration**: Seamlessly integrated with existing AI Help component
- ✅ **Lightweight**: Works without requiring external vector databases

## Current Implementation

The RAG system uses:
- **Embeddings**: Hash-based semantic vectors (lightweight)
- **Storage**: In-memory document store (can be extended to Firestore)
- **Retrieval**: Cosine similarity search
- **Generation**: Google Gemini AI models

## Future Enhancements

For production use, consider:

1. **Vertex AI Integration**: Use Vertex AI's `text-embedding-004` model for better embeddings
2. **Vector Database**: Store embeddings in:
   - Firestore (with vector extensions)
   - Pinecone
   - Weaviate
   - Vertex AI Vector Search
3. **Document Updates**: Automatically update embeddings when knowledge base changes
4. **Metadata Filtering**: Filter documents by category, date, etc.
5. **Hybrid Search**: Combine vector search with keyword search

## Usage

The RAG system is automatically integrated into the AI Help component. No additional setup required if you already have:

- ✅ Gemini API key configured (`VITE_GEMINI_API_KEY`)
- ✅ Existing AI Help feature working

## Technical Details

### Embedding Generation

Currently uses hash-based embeddings:
- Creates semantic vectors from text characteristics
- Normalized vectors for similarity calculation
- Works without external APIs

### Similarity Search

- Uses cosine similarity for vector comparison
- Threshold: 0.3 minimum similarity
- Returns top 5 most relevant documents

### Context Formatting

- Combines up to 5 retrieved documents
- Limits context to 2000 characters
- Preserves document metadata (title, category)

## Integration with AI Help

The RAG system enhances the existing `getHybridAIResponse` function:

1. **First**: Tries RAG-enhanced response
2. **Fallback**: Uses standard Gemini with local knowledge base
3. **Final Fallback**: Uses local knowledge base only

## Performance Considerations

- **Embeddings**: Generated on-the-fly (cached in memory)
- **Retrieval**: Fast in-memory search (< 50ms)
- **Generation**: Uses existing Gemini API calls

## Limitations

1. **Embeddings**: Hash-based (not as accurate as neural embeddings)
2. **Storage**: In-memory (not persistent)
3. **Scale**: Suitable for ~100-1000 documents

For larger scale, implement Vertex AI Vector Search or external vector database.

## Troubleshooting

### RAG not working
- Check that Gemini API key is configured
- Check browser console for errors
- System will fall back to standard Gemini if RAG fails

### Slow responses
- RAG adds minimal overhead (< 100ms)
- Most time is spent in Gemini API calls
- Consider caching embeddings for better performance

## Support

For issues or questions:
- Check browser console for detailed error messages
- Verify Gemini API key is valid
- Review `src/utils/ragSystem.js` for implementation details
