import { forwardRef } from 'react';
import { CharacterCard } from '@/components/characters/CharacterCard';
import { mockCharacters } from '@/data/characters';
import { Character } from '@/types';
import { useNavigate } from 'react-router-dom';

const DiscoverPage = forwardRef<HTMLDivElement, Record<string, never>>((_, ref) => {
  const navigate = useNavigate();

  const handleCharacterClick = (character: Character) => {
    navigate(`/chat/${character.id}`);
  };

  return (
    <div ref={ref} className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-display font-bold">Descubrir</h1>
            <p className="text-sm text-muted-foreground">Encuentra tu compañero perfecto</p>
          </div>
        </div>
      </header>

      {/* Character Grid */}
      <main className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {mockCharacters.map((character) => (
            <CharacterCard key={character.id} character={character} onClick={handleCharacterClick} />
          ))}
        </div>
      </main>
    </div>
  );
});

DiscoverPage.displayName = 'DiscoverPage';

export default DiscoverPage;
