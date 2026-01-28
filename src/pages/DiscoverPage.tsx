import { CharacterCard } from '@/components/characters/CharacterCard';
import { useCharacters } from '@/hooks/useCharacters';
import { Character } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { characters, loading } = useCharacters();

  const handleCharacterClick = (character: Character) => {
    navigate(`/chat/${character.id}`);
  };

  return (
    <div className="min-h-screen">
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">No hay personajes disponibles</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu primer personaje o activa el modo NSFW
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {characters.map((character) => (
              <CharacterCard key={character.id} character={character} onClick={handleCharacterClick} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DiscoverPage;
