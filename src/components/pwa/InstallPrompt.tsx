 import { useEffect, useState } from "react";
 import { X, Download, Smartphone } from "lucide-react";
 
 const InstallPrompt = () => {
   const [show, setShow] = useState(false);
   const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
 
   useEffect(() => {
     // Check if already shown
     const hasShown = localStorage.getItem("install-prompt-shown");
     if (hasShown) return;
 
     // Detect platform
     const userAgent = navigator.userAgent.toLowerCase();
     const isIOS = /iphone|ipad|ipod/.test(userAgent);
     const isAndroid = /android/.test(userAgent);
     
     // Only show on mobile devices
     if (!isIOS && !isAndroid) return;
     
     // Check if already installed as PWA
     const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
     if (isStandalone) return;
 
     setPlatform(isIOS ? "ios" : "android");
     
     // Show after intro video (delay 3 seconds)
     const timer = setTimeout(() => {
       setShow(true);
       localStorage.setItem("install-prompt-shown", "true");
     }, 3000);
 
     return () => clearTimeout(timer);
   }, []);
 
   useEffect(() => {
     if (show) {
       // Auto-hide after 6 seconds
       const hideTimer = setTimeout(() => {
         setShow(false);
       }, 6000);
       return () => clearTimeout(hideTimer);
     }
   }, [show]);
 
   if (!show) return null;
 
   return (
     <div className="fixed bottom-20 left-4 right-4 z-[9998] animate-fade-in">
       <div className="bg-gradient-to-r from-primary/90 to-primary-dark/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-primary/30">
         <button
           onClick={() => setShow(false)}
           className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
         >
           <X className="w-4 h-4 text-white" />
         </button>
         
         <div className="flex items-start gap-3">
           <div className="p-2 bg-white/20 rounded-xl">
             <Smartphone className="w-6 h-6 text-white" />
           </div>
           
           <div className="flex-1">
             <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
               <Download className="w-4 h-4" />
               ¡Instala la App!
             </h3>
             
             {platform === "ios" ? (
               <p className="text-white/90 text-xs leading-relaxed">
                 Toca el botón <span className="inline-flex items-center bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium">Compartir ↑</span> y luego <span className="font-semibold">"Añadir a pantalla de inicio"</span>
               </p>
             ) : (
               <p className="text-white/90 text-xs leading-relaxed">
                 Toca el menú <span className="inline-flex items-center bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium">⋮</span> y selecciona <span className="font-semibold">"Instalar aplicación"</span>
               </p>
             )}
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 export default InstallPrompt;