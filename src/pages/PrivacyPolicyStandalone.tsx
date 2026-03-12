import { useEffect } from 'react';

const PrivacyPolicyStandalone = () => {
  useEffect(() => {
    document.title = 'Política de Privacidad — Latin Girls Voice';
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#e2e2e2', backgroundColor: '#111', minHeight: '100vh' }}>
      <a href="/" style={{ color: '#d4af37', textDecoration: 'none', fontSize: 14 }}>← Volver al inicio</a>

      <h1 style={{ fontSize: 28, marginTop: 24, marginBottom: 8 }}>Política de Privacidad</h1>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>Última actualización: 31 de enero de 2026</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Introducción</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#ccc' }}>
          Bienvenido a <strong>Latin Girls Voice</strong> ("nosotros", "nuestro" o "la Plataforma").
          Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos
          su información personal cuando utiliza nuestra plataforma de procesamiento de lenguaje natural
          y generación de audio sintético con inteligencia artificial.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#ccc', marginTop: 8 }}>
          Al acceder o utilizar Latin Girls Voice, usted acepta las prácticas descritas en esta
          Política de Privacidad. Si no está de acuerdo con estas prácticas, por favor no utilice
          nuestra plataforma.
        </p>
      </section>

      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #aa3333', borderRadius: 8, backgroundColor: '#1a0a0a' }}>
        <h2 style={{ fontSize: 20, marginBottom: 12, color: '#ff6b6b' }}>Naturaleza del Contenido — Importante</h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#ff6b6b', marginBottom: 8 }}>
          Todo el contenido en Latin Girls Voice es generado por Inteligencia Artificial.
        </p>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li>Los personajes, imágenes, voces y conversaciones son <strong>100% ficticios</strong> y generados por IA.</li>
          <li><strong>Ninguna persona real</strong> está involucrada en la creación de los personajes o el contenido.</li>
          <li>Las imágenes NO representan personas reales ni están basadas en individuos existentes.</li>
          <li>Los diálogos y respuestas son generados algorítmicamente y no constituyen asesoramiento de ningún tipo.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Información que Recopilamos</h2>

        <h3 style={{ fontSize: 16, marginBottom: 8, marginTop: 16 }}>Información de Cuenta</h3>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li>Dirección de correo electrónico (proporcionada vía Google OAuth)</li>
          <li>Nombre de usuario o nombre de perfil</li>
          <li>Foto de perfil de Google (si está disponible)</li>
          <li>Identificador único de usuario</li>
        </ul>

        <h3 style={{ fontSize: 16, marginBottom: 8, marginTop: 16 }}>Datos de Uso</h3>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li>Historial de conversaciones con personajes de IA</li>
          <li>Personajes creados por el usuario</li>
          <li>Preferencias de configuración</li>
          <li>Marcas de tiempo de actividad</li>
        </ul>

        <h3 style={{ fontSize: 16, marginBottom: 8, marginTop: 16 }}>Datos Técnicos</h3>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li>Dirección IP (para seguridad y prevención de fraude)</li>
          <li>Tipo de navegador y dispositivo</li>
          <li>Sistema operativo</li>
          <li>Cookies y tecnologías similares</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Cómo Usamos su Información</h2>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li><strong>Proporcionar el Servicio:</strong> Permitir la interacción con personajes de IA y mantener su historial de conversaciones.</li>
          <li><strong>Autenticación:</strong> Verificar su identidad y mantener la seguridad de su cuenta.</li>
          <li><strong>Verificación de Edad:</strong> Confirmar que los usuarios son mayores de 18 años.</li>
          <li><strong>Mejora del Servicio:</strong> Analizar patrones de uso para mejorar la experiencia del usuario.</li>
          <li><strong>Seguridad:</strong> Detectar y prevenir actividades fraudulentas o abusivas.</li>
          <li><strong>Comunicaciones:</strong> Enviar notificaciones importantes sobre cambios en el servicio o políticas.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Almacenamiento y Seguridad</h2>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li>Sus datos se almacenan en servidores seguros con encriptación en tránsito y en reposo.</li>
          <li>Implementamos medidas de seguridad técnicas y organizativas para proteger su información.</li>
          <li>El acceso a los datos está restringido a personal autorizado únicamente.</li>
          <li>No compartimos ni vendemos su información personal a terceros.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Sus Derechos</h2>
        <p style={{ fontSize: 13, color: '#ccc', marginBottom: 8 }}>
          Bajo las leyes de protección de datos aplicables (incluyendo GDPR y CCPA), usted tiene los siguientes derechos:
        </p>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales.</li>
          <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
          <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos ("derecho al olvido").</li>
          <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado.</li>
          <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos en ciertas circunstancias.</li>
          <li><strong>Retiro del Consentimiento:</strong> Retirar su consentimiento en cualquier momento.</li>
        </ul>
        <p style={{ fontSize: 13, color: '#ccc', marginTop: 8 }}>
          Para ejercer cualquiera de estos derechos, contáctenos a través de los medios indicados al final de este documento.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Retención de Datos</h2>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li>Conservamos sus datos mientras mantenga una cuenta activa en la plataforma.</li>
          <li>El historial de conversaciones se mantiene para proporcionar continuidad en la experiencia.</li>
          <li>Puede solicitar la eliminación de sus datos en cualquier momento.</li>
          <li>Tras la eliminación de la cuenta, los datos se borran en un plazo de 30 días.</li>
          <li>Algunos datos pueden retenerse más tiempo si es requerido por ley.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Cookies y Tecnologías Similares</h2>
        <p style={{ fontSize: 13, color: '#ccc', marginBottom: 8 }}>Utilizamos cookies esenciales para:</p>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li>Mantener su sesión de usuario activa</li>
          <li>Recordar sus preferencias</li>
          <li>Garantizar la seguridad de la plataforma</li>
        </ul>
        <p style={{ fontSize: 13, color: '#ccc', marginTop: 8 }}>
          No utilizamos cookies de seguimiento de terceros ni publicidad dirigida.
        </p>
      </section>

      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #aa3333', borderRadius: 8, backgroundColor: '#1a0a0a' }}>
        <h2 style={{ fontSize: 20, marginBottom: 12, color: '#ff6b6b' }}>Protección de Menores</h2>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#ff6b6b', marginBottom: 8 }}>
          Latin Girls Voice es una plataforma EXCLUSIVAMENTE para adultos mayores de 18 años.
        </p>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li><strong>NO</strong> recopilamos intencionalmente información de menores de 18 años.</li>
          <li>Si descubrimos que un menor ha proporcionado información, la eliminaremos inmediatamente.</li>
          <li>Los padres o tutores pueden contactarnos para reportar el uso no autorizado por menores.</li>
          <li>Implementamos barreras de verificación de edad antes de mostrar contenido restringido.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Cambios en esta Política</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#ccc' }}>
          Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre
          cambios significativos publicando la nueva política en esta página y actualizando la
          fecha de "última actualización". Le recomendamos revisar esta política regularmente.
        </p>
      </section>

      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #d4af37', borderRadius: 8, backgroundColor: '#1a1500' }}>
        <h2 style={{ fontSize: 20, marginBottom: 12, color: '#d4af37' }}>Cláusula de Uso Responsable de IA</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#ccc', fontWeight: 600 }}>
          Todo el contenido en Latin Girls Voice es generado 100% de forma sintética mediante inteligencia artificial.
          No utilizamos rostros ni voces de personas reales. Queda estrictamente prohibido el uso de esta plataforma
          para crear "deepfakes", suplantar identidades o generar contenido sexual no consensuado. Esta herramienta
          utiliza APIs de voces comerciales pre-entrenadas y no permite la clonación de voces humanas. El incumplimiento
          resultará en la baja inmediata del servicio.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Contacto</h2>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#ccc' }}>
          Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, puede contactarnos:
        </p>
        <ul style={{ fontSize: 13, lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
          <li><strong>Correo electrónico:</strong> info@latingirlsvoice.com</li>
          <li><strong>Formulario de contacto:</strong> Disponible en la aplicación</li>
        </ul>
      </section>

      <footer style={{ borderTop: '1px solid #333', paddingTop: 16, fontSize: 12, color: '#777', display: 'flex', gap: 16 }}>
        <a href="/terms" style={{ color: '#d4af37' }}>Términos de Servicio →</a>
        <a href="/age-policy" style={{ color: '#d4af37' }}>Política de Verificación de Edad →</a>
      </footer>
    </div>
  );
};

export default PrivacyPolicyStandalone;
