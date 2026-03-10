import { useRef, Suspense, lazy } from "react";
import { motion, useInView } from "framer-motion";
import { LogoCloud } from "./components/LogoCloud";
import { ThemeToggle } from "./components/ThemeToggle";
import { InteractiveHoverButton } from "./components/InteractiveHoverButton";
import { BentoGrid, BentoCard } from "./components/BentoGrid";
import { Scan, Search, Activity, ShieldCheck, Zap, Home, Layers, Cpu, CloudUpload, BrainCircuit, FileText } from "lucide-react";
import { TubelightNavbar } from "./components/TubelightNavbar";

// Lazy-load the tech eye scene
const TechEyeScene = lazy(() => import("./EyeScene"));

/* ── Fallback ── */
function SceneFallback() {
    return <div className="scene-fixed-fallback" />;
}

/* ── Animated Section ── */
function AnimatedSection({ children, className = "", delay = 0, id }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

    return (
        <motion.section
            id={id}
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay, ease: "easeOut" }}
        >
            {children}
        </motion.section>
    );
}

export default function Landing({ onEnterApp }) {
    const logos = [
        { src: "https://svgl.app/library/nvidia-wordmark-light.svg", alt: "Nvidia" },
        { src: "https://svgl.app/library/openai_wordmark_light.svg", alt: "OpenAI" },
        { src: "https://svgl.app/library/github_wordmark_light.svg", alt: "GitHub" },
        { src: "https://svgl.app/library/vercel_wordmark.svg", alt: "Vercel" },
        { src: "https://svgl.app/library/claude-ai-wordmark-icon_light.svg", alt: "Claude AI" },
        { src: "https://svgl.app/library/supabase_wordmark_light.svg", alt: "Supabase" },
    ];

    const navItems = [
        { name: 'Inicio', url: '#halo', icon: Home },
        { name: 'Tecnología', url: '#features', icon: Layers },
        { name: 'Proceso', url: '#process', icon: Cpu }
    ];

    return (
        <div className="landing-container">
            {/* ── Fixed 3D Background ── */}
            <div className="fixed-3d-background">
                <Suspense fallback={<SceneFallback />}>
                    <TechEyeScene />
                </Suspense>
            </div>

            {/* ── Tubelight Navbar ── */}
            <TubelightNavbar items={navItems}>
                <ThemeToggle />
                <button
                    className="btn-nav"
                    onClick={onEnterApp}
                    style={{
                        padding: '0.4rem 1rem',
                        fontSize: '0.85rem',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Acceder
                </button>
            </TubelightNavbar>

            {/* ── Scrollable Content ── */}
            <div className="scroll-content">

                {/* 1. HERO SECTION (Text Left, Eye Right) */}
                <section id="halo" className="landing-section hero-section">
                    <div className="section-inner hero-inner">
                        <motion.div
                            className="hero-content"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <h1 className="hero-title">
                                Inteligencia Artificial<br />
                                <span className="text-gradient">que mira más allá</span>
                            </h1>
                            <p className="hero-desc">
                                La plataforma de análisis de retinografías más avanzada.
                                Precisión clínica potenciada por modelos de visión profunda.
                            </p>
                            <InteractiveHoverButton
                                className="btn-hero-interactive"
                                text="Iniciar Análisis"
                                onClick={onEnterApp}
                            />
                        </motion.div>
                        {/* Right side is empty for the Eye */}
                        <div className="hero-spacer"></div>
                    </div>

                    {/* Logo Cloud — inside hero so it's visible on first load */}
                    <motion.div
                        className="logo-cloud-inner hero-logos"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                    >
                        <p className="logo-cloud-label">Respaldado por líderes en IA y tecnología</p>
                        <div className="logo-cloud-divider" />
                        <LogoCloud logos={logos} />
                        <div className="logo-cloud-divider" />
                    </motion.div>
                </section>

                {/* 2. FEATURES SECTION (Eye Center/Background, Cards Grid) */}
                <AnimatedSection id="features" className="landing-section features-section">
                    <div className="section-inner">
                        <div className="section-header-center">
                            <h2>Tecnología de Vanguardia</h2>
                            <p>Nuestros modelos ven lo que el ojo humano podría pasar por alto.</p>
                        </div>

                        <BentoGrid>
                            <BentoCard
                                name="Segmentación Precisa"
                                Icon={Scan}
                                description="Algoritmos U-Net++ para delimitar con precisión quirúrgica el disco óptico, la copa y la macula, permitiendo el cálculo exacto de la relación copa-disco (CDR)."
                                href="#"
                                cta="Ver Detalles"
                            />
                            <BentoCard
                                name="Detección de Lesiones"
                                Icon={Search}
                                description="Localiza automáticamente microaneurismas, exudados duros/blandos y hemorragias, marcando las regiones de interés para facilitar el diagnóstico."
                                href="#"
                                cta="Explorar Modelos"
                            />
                            <BentoCard
                                name="Clasificación de Riesgo"
                                Icon={Activity}
                                description="Motor de inferencia profundo que categoriza el nivel de retinopatía diabética o riesgo de glaucoma en 5 grados clínicos estándar (ICDR)."
                                href="#"
                                cta="Ver Métricas"
                            />
                            <BentoCard
                                name="Seguridad y Privacidad"
                                Icon={ShieldCheck}
                                description="Encriptación de extremo a extremo (E2E) y cumplimiento con HIPAA/GDPR. Tus datos médicos nunca se comparten ni se usan para entrenar sin consentimiento explícito."
                                href="#"
                                cta="Leer Protocolo"
                            />
                        </BentoGrid>
                    </div>
                </AnimatedSection>

                {/* 3. PROCESS SECTION (Eye Left, Text Right) */}
                <AnimatedSection id="process" className="landing-section process-section">
                    <div className="section-inner process-inner">
                        {/* Left side empty for Eye */}
                        <div className="process-spacer"></div>

                        <div className="process-content">
                            <h2>Flujo Clínico Optimizado</h2>
                            <div className="process-timeline">
                                <div className="timeline-line" />

                                {/* Step 01 */}
                                <div className="timeline-step">
                                    <div className="step-icon-wrapper">
                                        <div className="step-icon-glow">
                                            <CloudUpload size={24} />
                                        </div>
                                    </div>
                                    <div className="step-content-card">
                                        <span className="step-number">01</span>
                                        <h3 className="step-card-title">Carga Segura</h3>
                                        <p className="step-card-desc">Subida encriptada de retinografías (DICOM/JPG) compatible con cualquier dispositivo de captura.</p>
                                    </div>
                                </div>

                                {/* Step 02 */}
                                <div className="timeline-step">
                                    <div className="step-icon-wrapper">
                                        <div className="step-icon-glow">
                                            <BrainCircuit size={24} />
                                        </div>
                                    </div>
                                    <div className="step-content-card">
                                        <span className="step-number">02</span>
                                        <h3 className="step-card-title">Análisis en Tiempo Real</h3>
                                        <p className="step-card-desc">Nuestros modelos de Vision Transformer procesan la imagen en &lt;2 segundos con precisión clínica.</p>
                                    </div>
                                </div>

                                {/* Step 03 */}
                                <div className="timeline-step">
                                    <div className="step-icon-wrapper">
                                        <div className="step-icon-glow">
                                            <FileText size={24} />
                                        </div>
                                    </div>
                                    <div className="step-content-card">
                                        <span className="step-number">03</span>
                                        <h3 className="step-card-title">Diagnóstico Asistido</h3>
                                        <p className="step-card-desc">Generación automática de pre-diagnóstico con mapas de calor y métricas de confianza para el especialista.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* 4. CTA SECTION (Eye Zoom In) */}
                <AnimatedSection className="landing-section cta-section">
                    <div className="cta-content-center">
                        <h2>¿Listo para el futuro?</h2>
                        <InteractiveHoverButton
                            className="btn-cta-interactive"
                            text="Ingresar al Sistema"
                            onClick={onEnterApp}
                        />
                    </div>
                </AnimatedSection>

                <footer className="landing-footer-minimal">
                    <p>© 2026 RetinaAI Research Group</p>
                </footer>

            </div>
        </div>
    );
}
