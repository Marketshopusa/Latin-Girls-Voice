import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crown, Check, X, Sparkles, Zap, Star, MessageCircle, Image, Volume2, Brain, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, PLAN_PRICES, PlanType } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

interface PlanFeature {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  premium: boolean | string;
  ultra: boolean | string;
}

const PLAN_FEATURES: PlanFeature[] = [
  { name: 'Personajes SFW', free: true, basic: true, premium: true, ultra: true },
  { name: 'Personajes NSFW', free: false, basic: true, premium: true, ultra: true },
  { name: 'Límite de conversaciones', free: '2', basic: 'Ilimitado', premium: 'Ilimitado', ultra: 'Ilimitado' },
  { name: 'Creación de personajes', free: '2', basic: '20/mes', premium: '50/mes', ultra: 'Ilimitado' },
  { name: 'Texto a voz (TTS)', free: false, basic: true, premium: true, ultra: true },
  { name: 'Voces Premium', free: false, basic: false, premium: false, ultra: true },
  { name: 'Generación de imágenes', free: false, basic: '40/mes', premium: '100/mes', ultra: 'Ilimitado' },
  { name: 'Memoria persistente', free: false, basic: true, premium: true, ultra: true },
  { name: 'Memoria Ultra', free: false, basic: false, premium: false, ultra: true },
  { name: 'Con publicidad', free: true, basic: false, premium: false, ultra: false },
  { name: 'Prioridad de respuesta', free: false, basic: false, premium: true, ultra: true },
];

const PlanCard = ({ 
  planKey, 
  name, 
  price, 
  isCurrentPlan,
  onSubscribe,
  isLoading,
  isPopular = false
}: { 
  planKey: PlanType;
  name: string;
  price: number | null;
  isCurrentPlan: boolean;
  onSubscribe: () => void;
  isLoading: boolean;
  isPopular?: boolean;
}) => {
  const getPlanIcon = () => {
    switch (planKey) {
      case 'basic': return <Zap className="h-6 w-6" />;
      case 'premium': return <Star className="h-6 w-6" />;
      case 'ultra': return <Crown className="h-6 w-6" />;
      default: return <Users className="h-6 w-6" />;
    }
  };

  const getPlanColor = () => {
    switch (planKey) {
      case 'basic': return 'from-blue-500 to-cyan-500';
      case 'premium': return 'from-amber-500 to-yellow-400';
      case 'ultra': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-400';
    }
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      isCurrentPlan 
        ? 'ring-2 ring-primary border-primary' 
        : 'hover:border-muted-foreground/50'
    } ${isPopular ? 'scale-105 z-10' : ''}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
          POPULAR
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-br-lg">
          TU PLAN
        </div>
      )}
      
      <CardHeader className="text-center pb-2">
        <div className={`mx-auto w-14 h-14 rounded-full bg-gradient-to-br ${getPlanColor()} flex items-center justify-center text-white mb-3`}>
          {getPlanIcon()}
        </div>
        <h3 className="text-xl font-bold">{name}</h3>
      </CardHeader>
      
      <CardContent className="text-center">
        <div className="mb-4">
          {price !== null ? (
            <>
              <span className="text-4xl font-bold">${price}</span>
              <span className="text-muted-foreground">/mes</span>
            </>
          ) : (
            <span className="text-4xl font-bold">Gratis</span>
          )}
        </div>
        
        <Button
          className={`w-full ${isCurrentPlan ? 'bg-muted text-muted-foreground' : `bg-gradient-to-r ${getPlanColor()} text-white hover:opacity-90`}`}
          disabled={isCurrentPlan || isLoading || planKey === 'free'}
          onClick={onSubscribe}
        >
          {isCurrentPlan ? 'Plan Actual' : planKey === 'free' ? 'Plan Base' : 'Suscribirse'}
        </Button>
      </CardContent>
    </Card>
  );
};

const FeatureRow = ({ feature }: { feature: PlanFeature }) => {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-sm">{value}</span>;
    }
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
    );
  };

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4 text-left font-medium">{feature.name}</td>
      <td className="py-3 px-2 text-center">{renderValue(feature.ultra)}</td>
      <td className="py-3 px-2 text-center">{renderValue(feature.premium)}</td>
      <td className="py-3 px-2 text-center">{renderValue(feature.basic)}</td>
      <td className="py-3 px-2 text-center">{renderValue(feature.free)}</td>
    </tr>
  );
};

export default function SubscriptionPage() {
  const { user, signInWithGoogle } = useAuth();
  const { plan, subscriptionEnd, isLoading, checkout, openCustomerPortal, refreshSubscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('¡Suscripción exitosa! Bienvenido al plan.');
      refreshSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Suscripción cancelada.');
    }
  }, [searchParams, refreshSubscription]);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para suscribirte');
      return;
    }

    setCheckingOut(true);
    try {
      await checkout(priceId);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Error al procesar la suscripción');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Error al abrir el portal de gestión');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="text-center py-12 px-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold">Planes de Suscripción</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades y desbloquea todas las funciones premium
        </p>
        
        {/* Current plan badge */}
        {user && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-lg py-2 px-4">
              <Crown className="h-4 w-4 mr-2" />
              Plan actual: <span className="font-bold ml-1 capitalize">{plan}</span>
            </Badge>
            {plan !== 'free' && (
              <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                Gestionar Suscripción
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Not logged in warning */}
      {!user && (
        <div className="max-w-md mx-auto mb-8 px-4">
          <Card className="bg-muted/50 border-primary/20">
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground mb-3">Inicia sesión para suscribirte a un plan</p>
              <Button onClick={signInWithGoogle} className="bg-gradient-to-r from-primary to-accent">
                Iniciar Sesión con Google
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Cards */}
      <div className="max-w-5xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          <PlanCard
            planKey="free"
            name="Gratuito"
            price={null}
            isCurrentPlan={plan === 'free'}
            onSubscribe={() => {}}
            isLoading={checkingOut || isLoading}
          />
          <PlanCard
            planKey="basic"
            name="Básico"
            price={PLAN_PRICES.basic.monthly}
            isCurrentPlan={plan === 'basic'}
            onSubscribe={() => handleSubscribe(PLAN_PRICES.basic.priceId)}
            isLoading={checkingOut || isLoading}
          />
          <PlanCard
            planKey="premium"
            name="Premium"
            price={PLAN_PRICES.premium.monthly}
            isCurrentPlan={plan === 'premium'}
            onSubscribe={() => handleSubscribe(PLAN_PRICES.premium.priceId)}
            isLoading={checkingOut || isLoading}
            isPopular
          />
          <PlanCard
            planKey="ultra"
            name="Ultra"
            price={PLAN_PRICES.ultra.monthly}
            isCurrentPlan={plan === 'ultra'}
            onSubscribe={() => handleSubscribe(PLAN_PRICES.ultra.priceId)}
            isLoading={checkingOut || isLoading}
          />
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-6">Comparación de Planes</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="py-4 px-4 text-left font-bold">Características</th>
                  <th className="py-4 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <Crown className="h-5 w-5 text-purple-500 mb-1" />
                      <span className="font-bold">Ultra</span>
                    </div>
                  </th>
                  <th className="py-4 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <Star className="h-5 w-5 text-amber-500 mb-1" />
                      <span className="font-bold">Premium</span>
                    </div>
                  </th>
                  <th className="py-4 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <Zap className="h-5 w-5 text-blue-500 mb-1" />
                      <span className="font-bold">Básico</span>
                    </div>
                  </th>
                  <th className="py-4 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="h-5 w-5 text-gray-500 mb-1" />
                      <span className="font-bold">Gratis</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_FEATURES.map((feature, index) => (
                  <FeatureRow key={index} feature={feature} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Footer info */}
      <div className="max-w-2xl mx-auto text-center mt-12 px-4">
        <p className="text-sm text-muted-foreground">
          Todos los planes incluyen acceso a la plataforma. Los límites se reinician cada mes.
          <br />
          Puedes cancelar tu suscripción en cualquier momento.
        </p>
      </div>
    </div>
  );
}
