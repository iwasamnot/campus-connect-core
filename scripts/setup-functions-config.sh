#!/bin/bash
# Setup script for Firebase Functions environment variables
# This configures Pinecone and OpenAI for the RAG vector service

echo "🔧 Setting up Firebase Functions configuration for RAG service..."
echo ""
echo "This will configure:"
echo "  - Pinecone API Key"
echo "  - Pinecone Index Name"
echo "  - OpenAI API Key (for embeddings)"
echo ""
echo "You can get these from:"
echo "  - Pinecone: https://app.pinecone.io/"
echo "  - OpenAI: https://platform.openai.com/api-keys"
echo ""

# Read values (or use environment variables if set)
if [ -z "$PINECONE_API_KEY" ]; then
  read -p "Enter Pinecone API Key: " PINECONE_API_KEY
fi

if [ -z "$PINECONE_INDEX_NAME" ]; then
  read -p "Enter Pinecone Index Name: " PINECONE_INDEX_NAME
fi

if [ -z "$OPENAI_API_KEY" ]; then
  read -p "Enter OpenAI API Key: " OPENAI_API_KEY
fi

echo ""
echo "📝 Setting Firebase Functions config..."

firebase functions:config:set \
  pinecone.api_key="$PINECONE_API_KEY" \
  pinecone.index="$PINECONE_INDEX_NAME" \
  openai.api_key="$OPENAI_API_KEY"

echo ""
echo "✅ Configuration set! Deploying functions..."
firebase deploy --only functions

echo ""
echo "🎉 Done! Your RAG vector service is now configured."
