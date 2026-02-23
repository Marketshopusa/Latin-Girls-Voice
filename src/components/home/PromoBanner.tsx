import { useState, useEffect } from 'react';
import { Sparkles, Check, Crown, ChevronRight, Gift, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePromoCode } from '@/hooks/usePromoCode';
import { useAuth } from '@/contexts/AuthContext';
import bannerBg from '@/assets/banner-bg.jpg';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PromoBannerProps {
  onCtaClick?: () => void;
}

export const PromoBanner = ({ onCtaClick }: PromoBannerProps) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { redeemCode, isRedeeming } = usePromoCode();
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (n: number) => n.toString().padStart(2, '0');

  const benefits = [
    'Chats ilimitados con IA',
    'Voces realistas premium',
    'Personajes exclusivos +18',
    'Generación de imágenes',
    'Crea personajes propios',
  ];

  const handleRedeemCode = async () => {
    if (!promoInput.trim()) return;
    const success = await redeemCode(promoInput);
    if (success) {
      setShowPromoModal(false);
      setPromoInput('');
    }
  };

  return (
    <>
      <div className={cn(
        "relative overflow-hidden rounded-xl mx-3 my-3",
        isMobile ? "rounded-lg" : "mx-6 my-4 rounded-2xl"
      )}>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60" />

        <div className={cn(
          "relative z-10 flex",
          isMobile ? "flex-col p-4 gap-4" : "flex-row items-center justify-between p-6 gap-8"
        )}>
          <div className={cn("flex-1", isMobile && "text-center")}>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3",
              "bg-primary/20 text-primary border border-primary/30"
            )}>
              <Crown className="h-3 w-3" />
              <span>Experiencia Premium</span>
              <Sparkles className="h-3 w-3" />
            </div>

            <h2 className={cn(
              "font-display font-bold leading-tight",
              isMobile ? "text-xl" : "text-3xl xl:text-4xl"
            )}>
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                Vive la Experiencia
              </span>
              <br />
              <span className="text-foreground">Sin Límites</span>
            </h2>

            <p className={cn(
              "text-muted-foreground mt-2",
              isMobile ? "text-sm" : "text-base"
            )}>
              Desbloquea todas las funciones premium
            </p>

            {/* Promo Code Link */}
            <button
              onClick={() => setShowPromoModal(true)}
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 text-xs font-bold transition-colors",
                "text-amber-400 hover:text-amber-300 underline underline-offset-4 drop-shadow-[0_0_6px_hsl(38_100%_50%/0.5)]"
              )}
            >
              <Gift className="h-3.5 w-3.5" />
              <span>🎁 Ingresa tu código promocional aquí</span>
            </button>

            {/* CTA Button */}
            <div className="mt-3">
              <button
                onClick={onCtaClick}
                className={cn(
                  "group relative inline-flex items-center gap-2 font-semibold rounded-full transition-all duration-300",
                  "bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground",
                  "hover:shadow-[0_0_30px_hsl(168_84%_40%/0.5)] hover:scale-105",
                  isMobile ? "px-5 py-2.5 text-sm" : "px-6 py-3 text-base"
                )}
              >
                <span>Comenzar Ahora</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>
              </button>
            </div>
          </div>

          <div className={cn(
            "flex gap-4",
            isMobile ? "flex-col" : "flex-row items-start gap-8"
          )}>
            <div className={cn("space-y-2", isMobile && "hidden")}>
              <p className="text-sm font-medium text-primary mb-3">Acceso completo incluye:</p>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-foreground/90">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl",
              "bg-background/60 backdrop-blur-sm border border-primary/20",
              isMobile && "flex-row justify-center"
            )}>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-destructive/90 text-destructive-foreground text-xs font-bold">
                <span className="opacity-70">HASTA</span>
                <span className="text-base">70%</span>
                <span className="opacity-70">OFF</span>
              </div>
              <div className="flex items-center gap-1 text-foreground">
                <TimeBlock value={formatTime(timeLeft.hours)} label="h" />
                <span className="text-primary font-bold">:</span>
                <TimeBlock value={formatTime(timeLeft.minutes)} label="m" />
                <span className="text-primary font-bold">:</span>
                <TimeBlock value={formatTime(timeLeft.seconds)} label="s" />
              </div>
              <p className={cn(
                "text-muted-foreground",
                isMobile ? "text-[10px] ml-2" : "text-xs text-center"
              )}>
                Oferta limitada
              </p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-xl pointer-events-none border border-primary/20" />
      </div>

      {/* Promo Code Modal */}
      <Dialog open={showPromoModal} onOpenChange={setShowPromoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Código Promocional
            </DialogTitle>
            <DialogDescription>
              Ingresa tu código para desbloquear 15 minutos de llamadas de voz y 15 respuestas con texto a voz.
            </DialogDescription>
          </DialogHeader>
          
          {!user ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Debes iniciar sesión para usar un código promocional.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Ej: LATINVOICE2025"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                maxLength={30}
                className="text-center font-mono text-lg tracking-wider"
                onKeyDown={(e) => e.key === 'Enter' && handleRedeemCode()}
              />
              <Button
                onClick={handleRedeemCode}
                disabled={isRedeeming || !promoInput.trim()}
                className="w-full bg-gradient-to-r from-primary to-cyan-400"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Canjeando...
                  </>
                ) : (
                  'Canjear Código'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const TimeBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="flex items-baseline gap-0.5">
    <span className="font-mono font-bold text-lg bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
      {value}
    </span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);
