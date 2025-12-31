import { useState, useEffect, useMemo, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Image as ImageIcon, X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';

const ImageGallery = memo(() => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, my, recent

  // Fetch images from messages
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imageMessages = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(msg => {
          const fileType = msg.fileName?.toLowerCase() || '';
          const fileUrl = msg.fileUrl || '';
          return fileType.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                 fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                 msg.attachment?.type?.startsWith('image/');
        });

      setImages(imageMessages);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching images:', error);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Image Gallery
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Browse all shared images
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Images</option>
          <option value="my">My Images</option>
          <option value="recent">Recent</option>
        </select>
      </div>

      {filteredImages.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No images found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => {
            const imageUrl = img.fileUrl || img.attachment?.url;
            if (!imageUrl) return null;

            return (
              <div
                key={img.id}
                className="relative group cursor-pointer bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-square"
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={imageUrl}
                  alt={img.fileName || 'Image'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
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
              </div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.fileUrl || selectedImage.attachment?.url}
              alt={selectedImage.fileName || 'Image'}
              className="max-w-full max-h-[90vh] mx-auto object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedImage.userName || 'Unknown'}</p>
                  <p className="text-sm opacity-75">{formatDate(selectedImage.timestamp)}</p>
                  {selectedImage.fileName && (
                    <p className="text-sm opacity-75 mt-1">{selectedImage.fileName}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(
                      selectedImage.fileUrl || selectedImage.attachment?.url,
                      selectedImage.fileName || 'image'
                    );
                  }}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  title="Download image"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;

