import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, UserCheck, AlertTriangle, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-display font-bold">Política de Privacidad</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Última actualización */}
        <p className="text-sm text-muted-foreground">
          Última actualización: 31 de enero de 2026
        </p>

        {/* Introducción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Introducción
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
               Bienvenido a <strong>Latin Girls Voice</strong> ("nosotros", "nuestro" o "la Plataforma"). 
              Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos 
              su información personal cuando utiliza nuestra plataforma de chat con personajes de 
              inteligencia artificial.
            </p>
            <p>
              Al acceder o utilizar Latin Girls Voice, usted acepta las prácticas descritas en esta
              Política de Privacidad. Si no está de acuerdo con estas prácticas, por favor no 
              utilice nuestra plataforma.
            </p>
          </CardContent>
        </Card>

        {/* Naturaleza del contenido */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Naturaleza del Contenido - Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <p className="font-semibold text-destructive mb-2">
                Todo el contenido en Latin Girls Voice es generado por Inteligencia Artificial.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Los personajes, imágenes, voces y conversaciones son <strong>100% ficticios</strong> y generados por IA.</li>
                <li>• <strong>Ninguna persona real</strong> está involucrada en la creación de los personajes o el contenido.</li>
                <li>• Las imágenes NO representan personas reales ni están basadas en individuos existentes.</li>
                <li>• El contenido explícito es <strong>exclusivamente para entretenimiento adulto</strong> y no refleja situaciones reales.</li>
                <li>• Los diálogos y respuestas son generados algorítmicamente y no constituyen asesoramiento de ningún tipo.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Información que recopilamos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Información que Recopilamos
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-4">
            <div>
              <h4 className="font-semibold text-foreground">Información de Cuenta</h4>
              <ul className="text-sm text-muted-foreground">
                <li>• Dirección de correo electrónico (proporcionada vía Google OAuth)</li>
                <li>• Nombre de usuario o nombre de perfil</li>
                <li>• Foto de perfil de Google (si está disponible)</li>
                <li>• Identificador único de usuario</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground">Datos de Uso</h4>
              <ul className="text-sm text-muted-foreground">
                <li>• Historial de conversaciones con personajes de IA</li>
                <li>• Personajes creados por el usuario</li>
                <li>• Preferencias de configuración (incluyendo modo NSFW)</li>
                <li>• Marcas de tiempo de actividad</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground">Datos Técnicos</h4>
              <ul className="text-sm text-muted-foreground">
                <li>• Dirección IP (para seguridad y prevención de fraude)</li>
                <li>• Tipo de navegador y dispositivo</li>
                <li>• Sistema operativo</li>
                <li>• Cookies y tecnologías similares</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Uso de la información */}
        <Card>
          <CardHeader>
            <CardTitle>Cómo Usamos su Información</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <ul className="space-y-2 text-sm">
              <li>• <strong>Proporcionar el Servicio:</strong> Permitir la interacción con personajes de IA y mantener su historial de conversaciones.</li>
              <li>• <strong>Autenticación:</strong> Verificar su identidad y mantener la seguridad de su cuenta.</li>
              <li>• <strong>Verificación de Edad:</strong> Confirmar que los usuarios que acceden a contenido NSFW son mayores de 18 años.</li>
              <li>• <strong>Mejora del Servicio:</strong> Analizar patrones de uso para mejorar la experiencia del usuario.</li>
              <li>• <strong>Seguridad:</strong> Detectar y prevenir actividades fraudulentas o abusivas.</li>
              <li>• <strong>Comunicaciones:</strong> Enviar notificaciones importantes sobre cambios en el servicio o políticas.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Almacenamiento y seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Almacenamiento y Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <ul className="space-y-2 text-sm">
              <li>• Sus datos se almacenan en servidores seguros con encriptación en tránsito y en reposo.</li>
              <li>• Implementamos medidas de seguridad técnicas y organizativas para proteger su información.</li>
              <li>• El acceso a los datos está restringido a personal autorizado únicamente.</li>
              <li>• Las conversaciones NSFW están protegidas con políticas de seguridad a nivel de base de datos (RLS).</li>
              <li>• No compartimos ni vendemos su información personal a terceros.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Sus derechos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Sus Derechos
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">
              Bajo las leyes de protección de datos aplicables (incluyendo GDPR y CCPA), usted tiene los siguientes derechos:
            </p>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Acceso:</strong> Solicitar una copia de sus datos personales.</li>
              <li>• <strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
              <li>• <strong>Eliminación:</strong> Solicitar la eliminación de sus datos ("derecho al olvido").</li>
              <li>• <strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado.</li>
              <li>• <strong>Oposición:</strong> Oponerse al procesamiento de sus datos en ciertas circunstancias.</li>
              <li>• <strong>Retiro del Consentimiento:</strong> Retirar su consentimiento en cualquier momento.</li>
            </ul>
            <p className="text-sm mt-4">
              Para ejercer cualquiera de estos derechos, contáctenos a través de los medios indicados al final de este documento.
            </p>
          </CardContent>
        </Card>

        {/* Retención de datos */}
        <Card>
          <CardHeader>
            <CardTitle>Retención de Datos</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <ul className="space-y-2 text-sm">
              <li>• Conservamos sus datos mientras mantenga una cuenta activa en la plataforma.</li>
              <li>• El historial de conversaciones se mantiene para proporcionar continuidad en la experiencia.</li>
              <li>• Puede solicitar la eliminación de sus datos en cualquier momento.</li>
              <li>• Tras la eliminación de la cuenta, los datos se borran en un plazo de 30 días.</li>
              <li>• Algunos datos pueden retenerse más tiempo si es requerido por ley.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Cookies y Tecnologías Similares</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">Utilizamos cookies esenciales para:</p>
            <ul className="space-y-2 text-sm">
              <li>• Mantener su sesión de usuario activa</li>
              <li>• Recordar sus preferencias (como el modo NSFW)</li>
              <li>• Garantizar la seguridad de la plataforma</li>
            </ul>
            <p className="text-sm mt-4">
              No utilizamos cookies de seguimiento de terceros ni publicidad dirigida.
            </p>
          </CardContent>
        </Card>

        {/* Menores de edad */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Protección de Menores
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <p className="font-semibold text-destructive mb-2">
                Latin Girls Voice es una plataforma EXCLUSIVAMENTE para adultos mayores de 18 años.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• <strong>NO</strong> recopilamos intencionalmente información de menores de 18 años.</li>
                <li>• El contenido NSFW (+18) requiere verificación explícita de mayoría de edad.</li>
                <li>• Si descubrimos que un menor ha proporcionado información, la eliminaremos inmediatamente.</li>
                <li>• Los padres o tutores pueden contactarnos para reportar el uso no autorizado por menores.</li>
                <li>• Implementamos barreras de verificación de edad antes de mostrar contenido explícito.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Cambios en la política */}
        <Card>
          <CardHeader>
            <CardTitle>Cambios en esta Política</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm">
              Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre 
              cambios significativos publicando la nueva política en esta página y actualizando la 
              fecha de "última actualización". Le recomendamos revisar esta política regularmente.
            </p>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">
              Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, 
              puede contactarnos a través de:
            </p>
            <ul className="text-sm">
              <li>• <strong>Correo electrónico:</strong> info@latingirlsvoice.com</li>
              <li>• <strong>Formulario de contacto:</strong> Disponible en la aplicación</li>
            </ul>
          </CardContent>
        </Card>

        {/* Enlaces relacionados */}
        <div className="flex flex-wrap gap-4 pt-4">
          <Link 
            to="/terms" 
            className="text-sm text-primary hover:underline"
          >
            Términos de Servicio →
          </Link>
          <Link 
            to="/age-policy" 
            className="text-sm text-primary hover:underline"
          >
            Política de Verificación de Edad →
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
