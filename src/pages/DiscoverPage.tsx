import { CharacterCard } from '@/components/characters/CharacterCard';
import { PromoBanner } from '@/components/home/PromoBanner';
import { useCharacters } from '@/hooks/useCharacters';
import { Character } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { characters, loading } = useCharacters();
  const isMobile = useIsMobile();

  const handleCharacterClick = (character: Character) => {
    navigate(`/chat/${character.id}`);
  };

  const handleBannerCta = () => {
    // Could navigate to pricing or show upgrade modal
    console.log('CTA clicked - implement upgrade flow');
  };

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
          </div>
        </header>
      )}

      {/* Character Grid */}
      <main className={cn(
        isMobile ? "p-3" : "p-6"
      )}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-muted-foreground">No hay personajes disponibles</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu primer personaje o activa el modo NSFW
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
            {characters.map((character) => (
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
