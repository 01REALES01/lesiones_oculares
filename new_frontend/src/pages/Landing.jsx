import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  CloudUpload,
  FlaskConical,
  Eye,
  FileText,
  Layers,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import TechEyeScene from '../components/landing/EyeScene';

const featureCards = [
  {
    title: 'Comparación de Modelos',
    description: 'Contrasta varias arquitecturas sobre la misma retinografía para validar consistencia clínica antes de revisar el detalle.',
    icon: Layers,
  },
  {
    title: 'Carga por Lotes',
    description: 'Sube carpetas completas y procesa múltiples estudios sin perder trazabilidad ni vista previa de cada caso.',
    icon: CloudUpload,
  },
  {
    title: 'Informe Asistido',
    description: 'Resume grado, confianza, prioridad y tiempos de inferencia en un formato rápido para el especialista.',
    icon: FileText,
  },
  {
    title: 'Uso Seguro',
    description: 'La plataforma está pensada para apoyo clínico y educativo, con foco en auditoría de resultados e historial.',
    icon: ShieldCheck,
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Carga de Retinografías',
    description: 'Selecciona imágenes individuales o lotes completos desde el panel principal.',
    icon: CloudUpload,
  },
  {
    number: '02',
    title: 'Inferencia Multimodelo',
    description: 'La API ejecuta los modelos disponibles y prioriza el mejor candidato compatible en tiempo real.',
    icon: BrainCircuit,
  },
  {
    number: '03',
    title: 'Revisión Clínica',
    description: 'Consulta el detalle, compara probabilidades y revisa el historial consolidado por estudio o lote.',
    icon: Stethoscope,
  },
];

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="relative max-w-2xl">
      {/* Aura de luz para proteger legibilidad del texto sobre el ojo/partículas */}
      <div className="pointer-events-none absolute -inset-6 -z-10 bg-white/50 blur-2xl rounded-full" />
      <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">{description}</p>
    </div>
  );
}

export default function Landing({ onEnterApp, onEnterDemo }) {
  const sections = useMemo(() => ['vision', 'capacidades', 'flujo'], []);
  const [activeSection, setActiveSection] = useState('vision');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0.1,
      }
    );

    sections.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [sections]);

  const handleSectionLink = (event, id) => {
    event.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_45%),linear-gradient(180deg,_#f8fbff_0%,_#eef5fb_50%,_#f8fbff_100%)] text-slate-900">
      {/* Ojo 3D: z-[1] queda encima del fondo, detrás del contenido (z-10) */}
      <div className="pointer-events-none fixed inset-0 z-[1] isolate" aria-hidden>
        <TechEyeScene />
      </div>

      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/40 bg-white/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">OcularAI</p>
            <p className="text-sm font-semibold text-slate-500">Análisis de retinografías asistido por IA</p>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/70 p-1 text-sm font-semibold md:flex">
            {sections.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(event) => handleSectionLink(event, id)}
                className={`rounded-full px-4 py-1.5 transition ${activeSection === id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-primary'}`}
              >
                {id === 'vision' ? 'Visión' : id === 'capacidades' ? 'Capacidades' : 'Flujo'}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEnterDemo}
              className="btn-premium border border-primary/30 bg-white/80 px-4 py-2 text-xs text-primary hover:bg-primary/10"
            >
              <FlaskConical size={14} />
              Ir a Demo
            </button>
            <button
              type="button"
              onClick={onEnterApp}
              className="btn-premium bg-primary px-5 py-3 text-sm text-white shadow-primary/30 hover:bg-primary-dark"
            >
              Entrar al sistema
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 pt-[88px]">
        <main className="">
          <section id="vision" className="scroll-mt-24 mx-auto grid max-w-7xl gap-10 px-6 py-20 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Aura de luz para proteger legibilidad del texto sobre el ojo/partículas */}
              <div className="pointer-events-none absolute -inset-10 -z-10 bg-white/50 blur-3xl rounded-full" />
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-primary shadow-sm">
                <Sparkles size={14} />
                Plataforma Principal
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-slate-950 md:text-7xl">
                Inteligencia artificial ocular lista para triage, comparación y auditoría.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                Esta landing es la entrada al sistema. Desde aquí el usuario entiende el flujo y luego pasa a la aplicación operativa con login, dashboard, historial y detalle clínico.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="btn-premium bg-primary px-6 py-4 text-base text-white shadow-primary/30 hover:bg-primary-dark"
                >
                  Ingresar ahora
                  <ArrowRight size={18} />
                </button>
                <a
                  href="#capacidades"
                  onClick={(event) => handleSectionLink(event, 'capacidades')}
                  className="btn-premium border border-slate-200 bg-white/80 px-6 py-4 text-base text-slate-700 shadow-sm hover:border-primary/30 hover:text-primary"
                >
                  Ver capacidades
                </a>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  ['3', 'rutas principales'],
                  ['100+', 'estudios por lote'],
                  ['1', 'historial consolidado'],
                ].map(([value, label]) => (
                  <div key={label} className="glass-panel px-5 py-4">
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-sky-200/60 blur-3xl" />
              <div className="absolute -right-4 bottom-0 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
              <div className="glass-panel relative overflow-hidden p-8 md:p-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(96,165,250,0.16),_transparent_38%,_rgba(255,255,255,0.45)_100%)]" />
                <div className="relative grid gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Vista previa</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">Entrada unificada</p>
                    </div>
                    <div className="rounded-3xl bg-primary/10 p-4 text-primary">
                      <Eye size={38} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Dashboard</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Carga, selección de modelos, cancelación de ejecución y vista de resultados recientes.</p>
                    </div>
                    <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Historial</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Consulta paginada, filtros por riesgo y acceso al detalle por análisis o lote.</p>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-primary/15 bg-slate-950 px-6 py-5 text-white shadow-xl">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">Estado del stack</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
                      <span className="rounded-full bg-white/10 px-3 py-1">FastAPI</span>
                      <span className="rounded-full bg-white/10 px-3 py-1">React + Vite</span>
                      <span className="rounded-full bg-white/10 px-3 py-1">Modelos RD</span>
                      <span className="rounded-full bg-white/10 px-3 py-1">Historial traceable</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section id="capacidades" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
            <SectionTitle
              eyebrow="Capacidades"
              title="La landing prepara al usuario antes de entrar al panel operativo."
              description="Se conservaron la narrativa y la intención de la landing original, pero adaptadas al stack actual para que cargue estable dentro de la aplicación principal."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, delay: index * 0.06 }}
                    className="glass-panel h-full p-6"
                  >
                    <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-5 text-xl font-black text-slate-900">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section id="flujo" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <SectionTitle
                eyebrow="Flujo"
                title="De la landing a la aplicación importante, sin romper el recorrido."
                description="El usuario aterriza aquí, comprende la propuesta y luego entra al login o directamente al dashboard si ya tiene sesión iniciada."
              />

              <div className="space-y-5">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.45, delay: index * 0.08 }}
                      className="glass-panel flex gap-5 p-6"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                        <Icon size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Paso {step.number}</p>
                        <h3 className="mt-2 text-xl font-black text-slate-900">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10 md:pb-24">
            <div className="glass-panel overflow-hidden rounded-[2rem] border border-primary/20 bg-[linear-gradient(135deg,_rgba(59,130,246,0.95),_rgba(96,165,250,0.78))] px-8 py-10 text-white md:px-12 md:py-14">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-100">Acceso</p>
                  <h2 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Cuando quieras, pasas de esta landing al sistema operativo real.</h2>
                  <p className="mt-4 text-base leading-7 text-sky-50/90 md:text-lg">La integración queda dentro de la misma SPA, sin saltos raros entre proyectos ni rutas rotas.</p>
                </div>

                <button
                  type="button"
                  onClick={onEnterApp}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-black text-primary transition hover:scale-[1.02]"
                >
                  Entrar a la app
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}