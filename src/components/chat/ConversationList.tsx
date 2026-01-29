import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface ConversationListProps {
  activeId?: string;
}

export const ConversationList = ({ activeId }: ConversationListProps) => {
  const navigate = useNavigate();
  const { conversations, isLoading, deleteConversation, isAuthenticated } = useUserConversations();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleSelect = (characterId: string) => {
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
      // If we deleted the active conversation, go home
      const deletedConv = conversations.find(c => c.id === conversationToDelete);
      if (deletedConv && deletedConv.character_id === activeId) {
        navigate('/');
      }
    } else {
      toast.error('Error al eliminar la conversación');
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Inicia sesión para ver tu historial de conversaciones</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tienes conversaciones aún</p>
            <p className="text-xs mt-1">Selecciona un personaje para empezar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {conversations.map((conv) => {
            if (!conv.character) return null;
            
            return (
              <button
                key={conv.id}
                onClick={() => handleSelect(conv.character_id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 hover:bg-sidebar-accent transition-colors text-left relative group',
                  activeId === conv.character_id && 'bg-sidebar-accent'
                )}
              >
                {/* Avatar */}
                <img
                  src={conv.character.image}
                  alt={conv.character.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm text-sidebar-foreground truncate">
                      {conv.character.name}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage || conv.character.tagline}
                  </p>
                </div>

                {/* Delete button - appears on hover */}
                {(hoveredId === conv.id) && (
                  <button
                    onClick={(e) => handleDeleteClick(e, conv.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                    title="Eliminar conversación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
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
