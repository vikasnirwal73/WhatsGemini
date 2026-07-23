import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCharacterById } from "../features/characterSlice";
import { fetchChats } from "../features/chatSlice";
import { FaArrowLeft, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { DisplayImage } from "../components/DisplayImage";
import { DialogRoot, DialogContent, DialogTitle, DialogClose } from "../components/ui/Dialog";

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
    // Radix Dialog already handles Escape; only arrow-key nav needs a listener here.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    if (selectedImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, handlePrev, handleNext]);

  if (loading && !character) {
    return <div className="flex h-screen items-center justify-center text-ink-muted">Loading gallery...</div>;
  }

  if (!character) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-app text-ink">
        <h2 className="text-2xl font-medium mb-4">Character not found</h2>
        <button onClick={() => navigate('/characters')} className="text-primary hover:underline">Return to Characters</button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-app overflow-auto p-4 md:p-8 relative">
      {/* Fullscreen Image Viewer */}
      <DialogRoot open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent size="full" className="!bg-transparent !border-none !shadow-none flex items-center justify-center">
          <DialogTitle asChild>
            <span className="sr-only">{character.name}'s gallery image</span>
          </DialogTitle>
          <DialogClose asChild>
            <button
              className="absolute top-4 right-4 p-2 text-white bg-black/50 rounded-full hover:bg-black/80 transition z-10"
            >
              <FaTimes size={24} />
            </button>
          </DialogClose>

          {hasPrev && (
            <button
              className="absolute left-4 md:left-8 p-3 text-white bg-black/50 rounded-full hover:bg-black/80 transition z-10"
              onClick={handlePrev}
              title="Previous (Left Arrow)"
            >
              <FaChevronLeft size={24} />
            </button>
          )}

          {selectedImage && (
            <DisplayImage
              srcContext={selectedImage}
              alt="Fullscreen generated"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl"
            />
          )}

          {hasNext && (
            <button
              className="absolute right-4 md:right-8 p-3 text-white bg-black/50 rounded-full hover:bg-black/80 transition z-10"
              onClick={handleNext}
              title="Next (Right Arrow)"
            >
              <FaChevronRight size={24} />
            </button>
          )}
        </DialogContent>
      </DialogRoot>

      <div className="w-full max-w-5xl mx-auto bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <button
              onClick={goBackInfo}
              className="p-2 rounded-full hover:bg-panel2 transition text-ink-muted"
              title="Back"
            >
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-medium tracking-wide text-ink">
              {character.name}'s Gallery
            </h2>
          </div>
        </div>

        {/* Gallery Grid */}
        {images.length === 0 ? (
          <div className="text-center mt-20 text-ink-muted">
            <p>No images in gallery yet.</p>
            <p className="text-sm mt-2">Images generated by this character will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
            {images.map((src, idx) => (
              <div
                key={idx}
                className="relative aspect-square w-full rounded-xl overflow-hidden bg-panel2 border border-line shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
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
