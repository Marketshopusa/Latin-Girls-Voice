import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, Shield, Ban, Scale, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-display font-bold">Términos de Servicio</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Última actualización */}
        <p className="text-sm text-muted-foreground">
          Última actualización: 31 de enero de 2026
        </p>

        {/* Aceptación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Aceptación de los Términos
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>
              Al acceder o utilizar <strong>Latin Girls Voice</strong> ("la Plataforma", "el Servicio"), 
              usted acepta estar legalmente vinculado por estos Términos de Servicio. Si no está 
              de acuerdo con alguna parte de estos términos, no debe utilizar la Plataforma.
            </p>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Los cambios entrarán en vigor inmediatamente después de su publicación. 
              El uso continuado del Servicio después de dichos cambios constituye su aceptación 
              de los nuevos términos.
            </p>
          </CardContent>
        </Card>

        {/* Descripción del servicio */}
        <Card>
          <CardHeader>
            <CardTitle>Descripción del Servicio</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="mb-4">
              Latin Girls Voice es una plataforma de entretenimiento que ofrece:
            </p>
            <ul className="space-y-2 text-sm">
              <li>• Conversaciones interactivas con personajes virtuales generados por Inteligencia Artificial</li>
              <li>• Generación de imágenes mediante IA basadas en el contexto de la conversación</li>
              <li>• Síntesis de voz (TTS) para dar vida a los personajes</li>
              <li>• Creación de personajes personalizados por parte de los usuarios</li>
              <li>• Contenido para adultos (+18) disponible bajo verificación de edad</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contenido generado por IA */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Globe className="h-5 w-5" />
              Contenido Generado por Inteligencia Artificial
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="font-semibold mb-3">
                El usuario reconoce y acepta que:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Todo el contenido es ficticio:</strong> Los personajes, imágenes, voces y diálogos son generados por algoritmos de IA y no representan personas reales.</li>
                <li>• <strong>Sin personas reales:</strong> Ninguna imagen representa, está basada en, o se deriva de fotografías de personas reales.</li>
                <li>• <strong>Entretenimiento únicamente:</strong> El contenido es para entretenimiento y no constituye asesoramiento profesional, médico, legal o de otro tipo.</li>
                <li>• <strong>Respuestas impredecibles:</strong> La IA puede generar respuestas inesperadas, inexactas o inapropiadas. Latin Girls Voice no se responsabiliza del contenido generado.</li>
                <li>• <strong>No almacenamiento permanente:</strong> Las imágenes generadas son temporales y no se almacenan de forma permanente en nuestros servidores.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Requisitos de edad */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Requisitos de Edad y Contenido para Adultos
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 space-y-4">
              <div>
                <p className="font-semibold text-destructive">Restricción de Edad</p>
                <p className="text-sm">
                  Esta plataforma está destinada EXCLUSIVAMENTE a usuarios mayores de 18 años. 
                  Al utilizar el Servicio, usted declara y garantiza que:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Tiene al menos 18 años de edad</li>
                  <li>• Es legalmente adulto en su jurisdicción</li>
                  <li>• Tiene la capacidad legal para aceptar estos términos</li>
                </ul>
              </div>
              
              <div>
                <p className="font-semibold text-destructive">Contenido NSFW (+18)</p>
                <p className="text-sm">
                  El contenido explícito para adultos solo está disponible para usuarios que:
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Han confirmado explícitamente ser mayores de 18 años</li>
                  <li>• Han aceptado ver contenido sin censura</li>
                  <li>• Residen en jurisdicciones donde este contenido es legal</li>
                </ul>
              </div>

              <p className="text-sm font-semibold text-destructive">
                La falsificación de la edad o el uso de la plataforma por menores resultará 
                en la terminación inmediata de la cuenta sin derecho a reembolso.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conducta del usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Conducta del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">Al utilizar Latin Girls Voice, usted acepta:</p>
            <ul className="space-y-2 text-sm">
              <li>• <strong>No usar la plataforma para actividades ilegales</strong> en su jurisdicción</li>
              <li>• <strong>No intentar eludir</strong> las medidas de verificación de edad</li>
              <li>• <strong>No compartir</strong> su cuenta con menores de edad</li>
              <li>• <strong>No crear contenido</strong> que represente o sugiera menores de edad</li>
              <li>• <strong>No distribuir</strong> el contenido generado como si fuera de personas reales</li>
              <li>• <strong>No usar</strong> la plataforma para acosar, difamar o dañar a otros</li>
              <li>• <strong>No intentar</strong> acceder sin autorización a sistemas o datos</li>
              <li>• <strong>No realizar</strong> ingeniería inversa del software o algoritmos</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contenido prohibido */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Contenido Estrictamente Prohibido
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
              <p className="text-sm mb-3">
                Está absolutamente prohibido crear, solicitar o compartir contenido que:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Involucre menores:</strong> Cualquier representación sexual o sugerente de menores de edad (real o ficticia)</li>
                <li>• <strong>Represente personas reales:</strong> Contenido sexual o difamatorio usando la identidad de personas reales sin consentimiento</li>
                <li>• <strong>Promueva violencia real:</strong> Instrucciones o incitación a la violencia contra personas o grupos</li>
                <li>• <strong>Contenga odio:</strong> Material que promueva discriminación basada en raza, religión, género, orientación sexual o discapacidad</li>
                <li>• <strong>Sea ilegal:</strong> Cualquier contenido que viole las leyes aplicables</li>
              </ul>
              <p className="text-sm mt-4 font-semibold text-destructive">
                Las violaciones de esta política resultarán en suspensión inmediata y permanente, 
                y pueden ser reportadas a las autoridades competentes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Propiedad intelectual */}
        <Card>
          <CardHeader>
            <CardTitle>Propiedad Intelectual</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <ul className="space-y-2 text-sm">
              <li>• <strong>Plataforma:</strong> Latin Girls Voice, su diseño, código y funcionalidades son propiedad exclusiva de sus creadores.</li>
              <li>• <strong>Contenido generado:</strong> Las imágenes y textos generados por la IA se proporcionan para uso personal y no comercial.</li>
              <li>• <strong>Personajes del usuario:</strong> Los personajes creados por usuarios siguen siendo propiedad intelectual del usuario, pero nos otorgan licencia para mostrarlos en la plataforma.</li>
              <li>• <strong>Sin garantía de exclusividad:</strong> El contenido generado por IA puede ser similar a contenido generado para otros usuarios.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitación de responsabilidad */}
        <Card>
          <CardHeader>
            <CardTitle>Limitación de Responsabilidad</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm mb-4">
              EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY:
            </p>
            <ul className="space-y-2 text-sm">
              <li>• El Servicio se proporciona "TAL CUAL" sin garantías de ningún tipo.</li>
              <li>• No garantizamos la disponibilidad ininterrumpida del Servicio.</li>
              <li>• No somos responsables de la exactitud o idoneidad del contenido generado por IA.</li>
              <li>• No somos responsables de daños indirectos, incidentales o consecuentes.</li>
              <li>• Nuestra responsabilidad total no excederá el monto pagado por usted en los últimos 12 meses.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Terminación */}
        <Card>
          <CardHeader>
            <CardTitle>Terminación</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <ul className="space-y-2 text-sm">
              <li>• Puede cancelar su cuenta en cualquier momento desde la configuración de la aplicación.</li>
              <li>• Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos.</li>
              <li>• Tras la terminación, se eliminarán sus datos según nuestra Política de Privacidad.</li>
              <li>• Algunas disposiciones sobreviven a la terminación (propiedad intelectual, limitación de responsabilidad).</li>
            </ul>
          </CardContent>
        </Card>

        {/* Ley aplicable */}
        <Card>
          <CardHeader>
            <CardTitle>Ley Aplicable y Jurisdicción</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm">
              Estos Términos se regirán e interpretarán de acuerdo con las leyes aplicables 
              en la jurisdicción donde opera la Plataforma. Cualquier disputa que surja de 
              estos términos será sometida a la jurisdicción exclusiva de los tribunales 
              competentes de dicha jurisdicción.
            </p>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p className="text-sm">
              Para preguntas sobre estos Términos de Servicio, contáctenos en:{' '}
              <strong>info@latingirlsvoice.com</strong>
            </p>
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

export default TermsOfServicePage;
