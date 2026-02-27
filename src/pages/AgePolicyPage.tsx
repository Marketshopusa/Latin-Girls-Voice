import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, UserCheck, AlertTriangle, Lock, Eye, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AgePolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            <h1 className="text-xl font-display font-bold">Política de Verificación de Edad</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Última actualización */}
        <p className="text-sm text-muted-foreground">
          Última actualización: 31 de enero de 2026
        </p>

        {/* Banner de advertencia */}
        <div className="p-6 bg-destructive/20 border-2 border-destructive rounded-xl">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-destructive mb-2">
                CONTENIDO EXCLUSIVO PARA ADULTOS (+18)
              </h2>
              <p className="text-foreground">
                Latin Girls Voice contiene material explícito generado por Inteligencia Artificial 
                destinado exclusivamente a personas adultas mayores de 18 años. El acceso de 
                menores está estrictamente prohibido.
              </p>
            </div>
          </div>
        </div>

        {/* Compromiso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Nuestro Compromiso con la Protección de Menores
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              Latin Girls Voice está comprometido con la protección de menores de edad. Implementamos 
              múltiples capas de verificación y control para garantizar que el contenido para 
              adultos solo sea accesible por personas que han confirmado legalmente ser mayores 
              de 18 años.
            </p>
            <p>
              Esta política describe nuestros procedimientos de verificación de edad, las 
              restricciones de contenido y las medidas que tomamos para prevenir el acceso 
              no autorizado por parte de menores.
            </p>
          </CardContent>
        </Card>

        {/* Sistema de verificación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Sistema de Verificación de Edad
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none space-y-4">
            <div>
              <h4 className="font-semibold text-foreground">1. Verificación en el Registro</h4>
              <p className="text-sm text-muted-foreground">
                Al crear una cuenta, los usuarios deben autenticarse mediante Google OAuth, 
                lo que proporciona una capa inicial de verificación de identidad.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground">2. Confirmación Explícita de Edad</h4>
              <p className="text-sm text-muted-foreground">
                Antes de acceder a cualquier contenido NSFW, los usuarios deben:
              </p>
              <ul className="text-sm text-muted-foreground">
                <li>• Activar manualmente el modo NSFW (+18)</li>
                <li>• Confirmar en un modal dedicado que son mayores de 18 años</li>
                <li>• Aceptar que es legal ver contenido adulto en su jurisdicción</li>
                <li>• Reconocer que el contenido incluye material explícito sin censura</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground">3. Autenticación Obligatoria</h4>
              <p className="text-sm text-muted-foreground">
                El contenido NSFW requiere inicio de sesión. Los visitantes anónimos no pueden 
                ver personajes o conversaciones marcadas como contenido para adultos.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground">4. Persistencia de Verificación</h4>
              <p className="text-sm text-muted-foreground">
                La confirmación de edad se almacena de forma segura y vinculada a la cuenta 
                del usuario, evitando verificaciones repetitivas pero manteniendo la trazabilidad.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contenido restringido */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Eye className="h-5 w-5" />
              Contenido Restringido a Mayores de 18
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">
              El siguiente contenido solo está disponible para usuarios verificados como adultos:
            </p>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Personajes NSFW:</strong> Personajes diseñados con temáticas adultas y diálogos explícitos</li>
              <li>• <strong>Imágenes generadas:</strong> Representaciones visuales de contenido adulto generadas por IA</li>
              <li>• <strong>Conversaciones sin censura:</strong> Diálogos que pueden incluir contenido sexual explícito</li>
              <li>• <strong>Creación de personajes adultos:</strong> La capacidad de crear personajes con contenido NSFW</li>
            </ul>
          </CardContent>
        </Card>

        {/* Medidas de seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Medidas de Seguridad Implementadas
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <ul className="space-y-3 text-sm">
              <li>
                <strong>Políticas de Seguridad a Nivel de Base de Datos (RLS):</strong>
                <p className="text-muted-foreground">
                  Los personajes NSFW están protegidos con políticas que impiden el acceso 
                  a nivel de base de datos para usuarios no autenticados.
                </p>
              </li>
              <li>
                <strong>Filtrado del Lado del Cliente:</strong>
                <p className="text-muted-foreground">
                  El contenido adulto se filtra automáticamente de la interfaz cuando el 
                  modo NSFW está desactivado.
                </p>
              </li>
              <li>
                <strong>Protección de Creadores:</strong>
                <p className="text-muted-foreground">
                  La identidad de los creadores de contenido NSFW está protegida y no se 
                  expone públicamente.
                </p>
              </li>
              <li>
                <strong>Registro de Actividad:</strong>
                <p className="text-muted-foreground">
                  Se mantienen registros de las confirmaciones de edad para fines de 
                  cumplimiento legal.
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Responsabilidades del usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Responsabilidades del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">Al utilizar Latin Girls Voice, usted es responsable de:</p>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Proporcionar información veraz</strong> sobre su edad</li>
              <li>• <strong>No compartir su cuenta</strong> con menores de edad</li>
              <li>• <strong>Mantener la confidencialidad</strong> de sus credenciales de acceso</li>
              <li>• <strong>No eludir</strong> los sistemas de verificación de edad</li>
              <li>• <strong>Supervisar el uso</strong> de dispositivos compartidos para evitar que menores accedan</li>
              <li>• <strong>Reportar</strong> cualquier sospecha de uso por menores</li>
            </ul>
          </CardContent>
        </Card>

        {/* Consecuencias */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Consecuencias por Violaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <p className="text-sm mb-3">
                Las violaciones de esta política tendrán las siguientes consecuencias:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Suspensión inmediata:</strong> La cuenta será suspendida sin previo aviso</li>
                <li>• <strong>Prohibición permanente:</strong> El usuario será excluido permanentemente de la plataforma</li>
                <li>• <strong>Sin reembolsos:</strong> No se otorgarán reembolsos por servicios pagados</li>
                <li>• <strong>Reporte a autoridades:</strong> Casos graves serán reportados a las autoridades competentes</li>
                <li>• <strong>Responsabilidad legal:</strong> El usuario será responsable de cualquier daño legal que resulte</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Para padres */}
        <Card>
          <CardHeader>
            <CardTitle>Información para Padres y Tutores</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">
              Si usted es padre o tutor y cree que un menor bajo su responsabilidad ha 
              accedido a nuestra plataforma:
            </p>
            <ul className="space-y-2 text-sm">
              <li>• Contáctenos inmediatamente a <strong>info@latingirlsvoice.com</strong></li>
              <li>• Proporcione el correo electrónico o identificador de la cuenta</li>
              <li>• Tomaremos medidas inmediatas para investigar y eliminar la cuenta</li>
              <li>• Todos los datos asociados serán eliminados permanentemente</li>
            </ul>
            <p className="text-sm mt-4">
              Recomendamos utilizar software de control parental y supervisar el uso de 
              internet por parte de menores.
            </p>
          </CardContent>
        </Card>

        {/* Herramientas recomendadas */}
        <Card>
          <CardHeader>
            <CardTitle>Herramientas de Control Parental Recomendadas</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">
              Para una protección adicional, recomendamos a los padres utilizar:
            </p>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Google Family Link</strong> - Control parental para dispositivos Android</li>
              <li>• <strong>Apple Screen Time</strong> - Restricciones para dispositivos iOS</li>
              <li>• <strong>Microsoft Family Safety</strong> - Control para Windows y Xbox</li>
              <li>• <strong>Net Nanny</strong> - Filtrado de contenido multiplataforma</li>
              <li>• <strong>Qustodio</strong> - Monitoreo y filtrado web</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto de Seguridad</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">
              Para reportar violaciones de la política de edad o preocupaciones de seguridad:
            </p>
            <ul className="text-sm">
              <li>• <strong>Correo prioritario:</strong> info@latingirlsvoice.com</li>
              <li>• <strong>Tiempo de respuesta:</strong> Menos de 24 horas para casos de menores</li>
            </ul>
          </CardContent>
        </Card>

        {/* Enlaces relacionados */}
        <div className="flex flex-wrap gap-4 pt-4">
          <Link 
            to="/privacy" 
            className="text-sm text-primary hover:underline"
          >
            Política de Privacidad →
          </Link>
          <Link 
            to="/terms" 
            className="text-sm text-primary hover:underline"
          >
            Términos de Servicio →
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AgePolicyPage;
