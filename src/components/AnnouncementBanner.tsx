import { X } from "lucide-react";
import { useState } from "react";

const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary to-primary/90 text-primary-foreground py-3 px-4 h-12 flex items-center">
      <div className="container mx-auto flex items-center justify-center relative">
        <p className="text-sm md:text-base text-center font-medium">
          🎯 Agende sua primeira consulta e inicie sua jornada de autoconhecimento
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-0 p-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Fechar banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;