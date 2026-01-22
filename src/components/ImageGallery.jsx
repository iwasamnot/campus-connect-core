import { useState, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { Image as ImageIcon, X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import ImagePreview from './ImagePreview';

const ImageGallery = memo(() => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, my, recent

  // Fetch images from messages
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    // Try query with orderBy, but fallback to simple query if index is missing
    let q;
    try {
      q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(200) // Increased limit to get more images
      );
    } catch (error) {
      console.warn('Error creating query with orderBy, using simple query:', error);
      q = query(
        collection(db, 'messages'),
        limit(200)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imageMessages = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        })
        .filter(msg => {
          // Check multiple possible image fields
          const hasFileUrl = msg.fileUrl && typeof msg.fileUrl === 'string';
          const hasAttachment = msg.attachment && msg.attachment.url;
          const hasPreview = msg.preview && typeof msg.preview === 'string';
          
          // Check file name extensions
          const fileName = msg.fileName?.toLowerCase() || msg.attachment?.name?.toLowerCase() || '';
          const fileUrl = (msg.fileUrl || msg.attachment?.url || msg.preview || '').toLowerCase();
          
          // Check if it's an image by extension or MIME type
          const isImageByExtension = fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || 
                                     fileUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
          const isImageByType = msg.attachment?.type?.startsWith('image/') || 
                               msg.fileType?.startsWith('image/');
          
          // Must have a URL and be identified as an image
          return (hasFileUrl || hasAttachment || hasPreview) && (isImageByExtension || isImageByType);
        })
        .sort((a, b) => {
          // Sort by timestamp if available
          const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
          const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
          return bTime - aTime;
        });

      console.log(`ImageGallery: Found ${imageMessages.length} images out of ${snapshot.docs.length} messages`);
      setImages(imageMessages);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching images:', error);
      if (error.code === 'failed-precondition') {
        console.warn('Firestore index missing. Please create index for messages collection with timestamp field.');
        // Try without orderBy
        const simpleQuery = query(collection(db, 'messages'), limit(200));
        const fallbackUnsubscribe = onSnapshot(simpleQuery, (snapshot) => {
          const imageMessages = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(msg => {
              const hasFileUrl = msg.fileUrl || msg.attachment?.url || msg.preview;
              const fileName = (msg.fileName || msg.attachment?.name || '').toLowerCase();
              const fileUrl = (msg.fileUrl || msg.attachment?.url || msg.preview || '').toLowerCase();
              return hasFileUrl && (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                                    fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                                    msg.attachment?.type?.startsWith('image/'));
            })
            .sort((a, b) => {
              const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
              const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
              return bTime - aTime;
            });
          setImages(imageMessages);
          setLoading(false);
        });
        return () => fallbackUnsubscribe();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const filteredImages = useMemo(() => {
    switch (filter) {
      case 'my':
        return images.filter(img => img.userId === user?.uid);
      case 'recent':
        return images.slice(0, 20);
      default:
        return images;
    }
  }, [images, filter, user?.uid]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLoader key={i} height="200px" rounded={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
        style={{
          paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-glow flex items-center gap-2">
            <div className="p-2 glass-panel border border-white/10 rounded-xl">
              <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
            </div>
            <span>Image Gallery</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Browse all shared images
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-300 hover:border-white/20 [color-scheme:dark]"
        >
          <option value="all" className="bg-[#1a1a1a] text-white">All Images</option>
          <option value="my" className="bg-[#1a1a1a] text-white">My Images</option>
          <option value="recent" className="bg-[#1a1a1a] text-white">Recent</option>
        </select>
      </div>

      {filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block p-4 glass-panel border border-white/10 rounded-2xl mb-4"
          >
            <ImageIcon className="w-16 h-16 text-white/40 mx-auto" />
          </motion.div>
          <p className="text-white/60 font-medium">
            No images found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => {
            // Try multiple possible image URL fields
            const imageUrl = img.fileUrl || img.attachment?.url || img.preview;
            if (!imageUrl) {
              console.warn('ImageGallery: No image URL found for message:', img.id);
              return null;
            }

            return (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative group cursor-pointer glass-panel border border-white/10 rounded-xl overflow-hidden aspect-square"
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={imageUrl}
                  alt={img.fileName || 'Image'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    // Handle Firebase Storage 402 errors gracefully
                    if (e.target.src.includes('firebasestorage.googleapis.com')) {
                      console.warn('Firebase Storage image unavailable (402 error):', e.target.src);
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM3NDE1MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=';
                      e.target.alt = 'Image unavailable - Firebase Storage requires Blaze plan';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{img.userName || 'Unknown'}</p>
                  <p className="text-white text-xs">{formatDate(img.timestamp)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Use ImagePreview component for better UX */}
      {selectedImage && (
        <ImagePreview
          imageUrl={selectedImage.fileUrl || selectedImage.attachment?.url || selectedImage.preview}
          imageName={selectedImage.fileName || selectedImage.attachment?.name || 'Image'}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
});

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;

