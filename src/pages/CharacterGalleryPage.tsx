import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCharacterById } from "../features/characterSlice";
import { fetchChats } from "../features/chatSlice";
import { FaArrowLeft, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { DisplayImage } from "../components/DisplayImage";

const CharacterGalleryPage = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const characterIdNum = characterId ? Number(characterId) : null;
  
  const characters = useAppSelector((state) => state.character.characters);
  const character = characters.find(c => c.id === characterIdNum);
  const loading = useAppSelector((state) => state.character.loading);
  const chats = useAppSelector((state) => state.chat.chats);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (characterIdNum) {
      dispatch(fetchCharacterById(characterIdNum));
      dispatch(fetchChats());
    }
  }, [dispatch, characterIdNum]);

  const goBackInfo = () => {
    navigate(-1);
  };

  const images = useMemo(() => {
    if (!character) return [];
    
    // Get explicitly saved gallery images
    const galleryImages = character.gallery || [];
    
    // Also find any images generated in previous chats associated with this character
    const chatImages = chats
      .filter(chat => chat.characterId === characterIdNum)
      .flatMap(chat => chat.content)
      .flatMap(msg => msg.images || []);
      
    // Combine and remove duplicates
    return Array.from(new Set([...galleryImages, ...chatImages]));
  }, [character, chats, characterIdNum]);

  const currentIndex = selectedImage ? images.indexOf(selectedImage) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < images.length - 1;

  const handlePrev = React.useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hasPrev) setSelectedImage(images[currentIndex - 1]);
  }, [hasPrev, images, currentIndex]);

  const handleNext = React.useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (hasNext) setSelectedImage(images[currentIndex + 1]);
  }, [hasNext, images, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    
    // Allow keyboard navigation if an image is selected
    if (selectedImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, handlePrev, handleNext]);

  if (loading && !character) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading gallery...</div>;
  }

  if (!character) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-app-light dark:bg-app-dark text-gray-800 dark:text-gray-200">
        <h2 className="text-2xl font-medium mb-4">Character not found</h2>
        <button onClick={() => navigate('/characters')} className="text-indigo-500 hover:underline">Return to Characters</button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-app-light dark:bg-app-dark overflow-auto p-4 md:p-8 relative">
      {/* Fullscreen Image Overlay */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white bg-black/50 rounded-full hover:bg-black/80 transition z-[60]"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <FaTimes size={24} />
          </button>

          {hasPrev && (
            <button 
              className="absolute left-4 md:left-8 p-3 text-white bg-black/50 rounded-full hover:bg-black/80 transition z-[60]"
              onClick={handlePrev}
              title="Previous (Left Arrow)"
            >
              <FaChevronLeft size={24} />
            </button>
          )}

          <div className="max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <DisplayImage 
              srcContext={selectedImage} 
              alt="Fullscreen generated" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded border border-gray-700 shadow-2xl" 
            />
          </div>

          {hasNext && (
            <button 
              className="absolute right-4 md:right-8 p-3 text-white bg-black/50 rounded-full hover:bg-black/80 transition z-[60]"
              onClick={handleNext}
              title="Next (Right Arrow)"
            >
              <FaChevronRight size={24} />
            </button>
          )}
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={goBackInfo}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition text-gray-500 dark:text-slate-400"
              title="Back"
            >
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-medium tracking-wide text-gray-900 dark:text-slate-100">
              {character.name}'s Gallery
            </h2>
          </div>
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          <div className="text-center mt-20 text-gray-500 dark:text-slate-400">
            <p>No images in gallery yet.</p>
            <p className="text-sm mt-2">Images generated by this character will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
            {images.map((src, idx) => (
              <div 
                key={idx} 
                className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-800 border border-gray-200 dark:border-slate-700/50 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage(src)}
              >
                <DisplayImage srcContext={src} alt={`${character.name} generated image ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterGalleryPage;