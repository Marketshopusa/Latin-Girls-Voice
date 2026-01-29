import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import { useUserConversations } from '@/hooks/useUserConversations';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MessagesPage = () => {
  const navigate = useNavigate();
  const { conversations, isLoading, deleteConversation, isAuthenticated } = useUserConversations();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleSelectConversation = (characterId: string) => {
    navigate(`/chat/${characterId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;
    
    const success = await deleteConversation(conversationToDelete);
    if (success) {
      toast.success('Conversación eliminada');
    } else {
      toast.error('Error al eliminar la conversación');
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-6 py-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-display font-bold">Mensajes</h1>
              <p className="text-sm text-muted-foreground">
                Tus conversaciones recientes
              </p>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-6 py-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-display font-bold">Mensajes</h1>
              <p className="text-sm text-muted-foreground">
                Tus conversaciones recientes
              </p>
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Inicia sesión para ver tus mensajes</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Cuando inicies sesión, aquí aparecerán todas las conversaciones que tengas con los personajes.
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-6 py-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-display font-bold">Mensajes</h1>
              <p className="text-sm text-muted-foreground">
                Tus conversaciones recientes
              </p>
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-2">No tienes conversaciones aún</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Explora los personajes disponibles y empieza a chatear. Tus conversaciones aparecerán aquí.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Descubrir personajes
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-6 py-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-display font-bold">Mensajes</h1>
              <p className="text-sm text-muted-foreground">
                Tus conversaciones recientes
              </p>
            </div>
          </div>
        </header>

        {/* Conversations */}
        <main className="divide-y divide-border">
          {conversations.map((conv) => {
            if (!conv.character) return null;
            
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.character_id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="w-full flex items-start gap-4 p-4 hover:bg-card transition-colors text-left relative group"
              >
                {/* Avatar */}
                <img
                  src={conv.character.image}
                  alt={conv.character.name}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-display font-semibold text-foreground">
                      {conv.character.name}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {conv.lastMessage || conv.character.welcomeMessage}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex items-center gap-2 mt-2">
                    {conv.character.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag-chip text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Delete button - appears on hover */}
                {hoveredId === conv.id && (
                  <button
                    onClick={(e) => handleDeleteClick(e, conv.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                    title="Eliminar conversación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </button>
            );
          })}
        </main>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MessagesPage;
