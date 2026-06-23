import { CharacterCard } from '@/components/characters/CharacterCard';
import { PromoBanner } from '@/components/home/PromoBanner';
import { useCharacters } from '@/hooks/useCharacters';
import { Character } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useNsfw } from '@/contexts/NsfwContext';
import { useState, useEffect } from 'react';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { characters, loading } = useCharacters();
  const isMobile = useIsMobile();
  const { nsfwEnabled } = useNsfw();
  const [activeTab, setActiveTab] = useState<'sfw' | 'nsfw'>('sfw');

  useEffect(() => {
    if (!nsfwEnabled) {
      setActiveTab('sfw');
    }
  }, [nsfwEnabled]);

  const handleCharacterClick = (character: Character) => {
    navigate(`/chat/${character.id}`);
  };

  const handleBannerCta = () => {
    navigate('/subscription');
  };

  const sfwCharacters = characters.filter((c) => !c.nsfw);
  const nsfwCharacters = characters.filter((c) => c.nsfw);
  const displayedCharacters = activeTab === 'sfw' ? sfwCharacters : nsfwCharacters;

  return (
    <div className="min-h-screen">
      {/* Promo Banner */}
      <PromoBanner onCtaClick={handleBannerCta} />

      {/* Header - Only show on desktop since mobile has MobileTopNav */}
      {!isMobile && (
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold">
                Descubrir
              </h1>
              <p className="text-sm text-muted-foreground">Encuentra tu compañero perfecto</p>
            </div>
            <a
              href="/privacy"
              className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
            >
              Política de Privacidad
            </a>
          </div>
        </header>
      )}

      {/* Separate Tabs for SFW / NSFW when Plus+18 is enabled */}
      {nsfwEnabled && (
        <div className="flex justify-center border-b border-border bg-background/50 sticky top-14 lg:top-0 z-20 backdrop-blur-sm">
          <div className="flex gap-4 p-2">
            <button
              onClick={() => setActiveTab('sfw')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                activeTab === 'sfw'
                  ? "bg-primary text-primary-foreground shadow-glow font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Normales ({sfwCharacters.length})
            </button>
            <button
              onClick={() => setActiveTab('nsfw')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5",
                activeTab === 'nsfw'
                  ? "bg-destructive text-destructive-foreground shadow-glow font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Plus +18 ({nsfwCharacters.length})
            </button>
          </div>
        </div>
      )}

      {/* Character Grid */}
      <main className={cn(
        isMobile ? "p-3" : "p-6"
      )}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayedCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-muted-foreground">No hay personajes disponibles en esta categoría</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'sfw' 
                ? "Crea tu primer personaje SFW para empezar." 
                : "Crea tu primer personaje NSFW para empezar."}
            </p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-3",
            // Mobile: 2 columns with tight gap
            // Tablet: 3 columns
            // Desktop: 4-5 columns
            isMobile 
              ? "grid-cols-2" 
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          )}>
            {displayedCharacters.map((character) => (
              <CharacterCard 
                key={character.id} 
                character={character} 
                onClick={handleCharacterClick} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DiscoverPage;
