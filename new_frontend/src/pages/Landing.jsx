import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  CloudUpload,
  FlaskConical,
  FileText,
  Layers,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import TechEyeScene from '../components/landing/EyeScene';

const featureCards = [
  {
    title: 'Comparación de modelos',
    description:
      'Ejecuta en la misma imagen varias redes entrenadas para retinopatía diabética (p. ej. DenseNet169, ResNet50, Xception) y contrasta resultados antes de abrir el detalle.',
    icon: Layers,
  },
  {
    title: 'Carga de imágenes y lotes',
    description:
      'Importa archivos de fondo de ojo de forma individual o en bloque. Cada envío queda asociado a un identificador de lote para seguimiento.',
    icon: CloudUpload,
  },
  {
    title: 'Resultados estructurados',
    description:
      'Cada inferencia devuelve etiquetas, niveles de confianza, tiempos de cómputo y metadatos técnicos en un formato homogéneo, apto para revisión por unidad asistencial o docencia.',
    icon: FileText,
  },
  {
    title: 'Trazabilidad y control de acceso',
    description:
      'Registro de inferencias con identificador único, registro de modelos usados y acceso restringido mediante autenticación. Destinado a apoyo a la decisión, formación o investigación con supervisión clínica.',
    icon: ShieldCheck,
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Carga y selección de modelos',
    description:
      'Sube retinografías en formatos habituales (p. ej. PNG, JPEG) y elige qué arquitecturas desea ejecutar en la comparación.',
    icon: CloudUpload,
  },
  {
    number: '02',
    title: 'Procesamiento en el servidor',
    description:
      'El servicio aplica preprocesado de imagen, invoca los modelos disponibles y mide el tiempo de cada inferencia. Si un modelo no está cargado, se indica en la respuesta.',
    icon: BrainCircuit,
  },
  {
    number: '03',
    title: 'Revisión y archivo',
    description:
      'Visualiza el detalle de cada análisis, el historial filtrable y, cuando corresponda, documentación de la trazabilidad (identificador de inferencia, instante y modelos empleados).',
    icon: Stethoscope,
  },
];

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function Landing({ onEnterApp, onEnterDemo }) {
  const sections = useMemo(() => ['vision', 'capacidades', 'flujo'], []);
  const [activeSection, setActiveSection] = useState('vision');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: null,
        threshold: [0.25, 0.5, 0.75],
        rootMargin: '-20% 0px -35% 0px',
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

  const goToPropuesta = (e) => {
    e.preventDefault();
    document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative overflow-x-hidden text-slate-900">
      {/* Ojo 3D: z-[1] queda encima de body::before/::after (z negativos), detrás del contenido (z-10) */}
      <div className="pointer-events-none fixed inset-0 z-[1] isolate" aria-hidden>
        <TechEyeScene />
      </div>

      <div className="relative z-10">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4 md:px-10">
          <a href="#vision" onClick={goToPropuesta} className="min-w-0 flex-shrink-0">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">OcularAI</p>
          </a>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0 md:flex">
            <div className="flex items-center gap-1 rounded-full border border-white/60 bg-white/70 p-1 text-sm font-semibold">
              {sections.map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(event) => handleSectionLink(event, id)}
                  className={`rounded-full px-4 py-1.5 transition ${
                    activeSection === id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-primary'
                  }`}
                >
                  {id === 'vision' ? 'Propuesta' : id === 'capacidades' ? 'Funciones' : 'Proceso'}
                </a>
              ))}
            </div>
          </nav>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onEnterDemo}
              className="btn-premium flex items-center gap-1.5 border border-primary/30 bg-white/80 px-4 py-2 text-xs text-primary hover:bg-primary/10"
            >
              <FlaskConical size={14} />
              Demostración
            </button>
            <button
              type="button"
              onClick={onEnterApp}
              className="btn-premium bg-primary px-5 py-3 text-sm text-white shadow-primary/30 hover:bg-primary-dark"
            >
              Acceder
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="vision" className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
              <ShieldCheck size={14} className="text-primary" />
              No constituye dispositivo ni diagnóstico automático
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Lectura asistida de retinografías: comparación de modelos, registro y revisión
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Sistema web con API dedicada a imagen de fondo de ojo, orientado a{' '}
              <strong className="font-semibold text-slate-800">soporte a la decisión clínica, docencia o investigación</strong>{' '}
              bajo responsabilidad profesional. Los resultados son propuestas algorítmicas; la interpretación definitiva corresponde al
              servicio de oftalmología o a la unidad asistencial competente.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={onEnterApp}
                className="btn-premium bg-primary px-6 py-4 text-base text-white shadow-primary/30 hover:bg-primary-dark"
              >
                Acceder con usuario
                <ArrowRight size={18} />
              </button>
              <a
                href="#capacidades"
                onClick={(event) => handleSectionLink(event, 'capacidades')}
                className="btn-premium border border-slate-200 bg-white/80 px-6 py-4 text-base text-slate-700 shadow-sm hover:border-primary/30 hover:text-primary"
              >
                Ver funciones
              </a>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                [
                  'Modelos comparables',
                  'Varias arquitecturas de clasificación (según carga y disponibilidad) sobre el mismo estudio',
                ],
                [
                  'Trazabilidad',
                  'Cada inferencia con identificador, modelo(s) y marca temporal en el historial',
                ],
                [
                  'Ámbito de uso',
                  'Tamizaje y formación, no reemplazo del juicio clínico',
                ],
              ].map(([title, body]) => (
                <div key={title} className="glass-panel border border-slate-100 px-5 py-4 text-left">
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Columna derecha: espacio para el ojo 3D (canvas fijo detrás) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative hidden min-h-[min(70vh,520px)] lg:block"
            aria-hidden
          >
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/25 bg-white/5 shadow-inner backdrop-blur-[2px]" />
          </motion.div>
        </section>

        <section id="capacidades" className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <SectionTitle
            eyebrow="Funciones"
            title="Qué ofrece el entorno conectado a la API"
            description="Herramientas descritas en el ámbito de un software de apoyo: comparación, documentación básica de resultados e historial con control de acceso. La disponibilidad efectiva de cada modelo depende de su despliegue en el servidor."
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
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="flujo" className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionTitle
              eyebrow="Proceso"
              title="Secuencia de uso habitual"
              description="Tras autenticarse (entorno restringido), el flujo es lineal: carga de imágenes, invocación de modelos, consulta de resultados e historial. La demostración pública, si está activada, omite el login y aplica un subconjunto de reglas de negocio."
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
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Paso {step.number}</p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Cierre: aviso de responsabilidad y accesos */}
        <section
          id="cierre"
          className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-10 md:px-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel overflow-hidden rounded-[2rem] border border-primary/20 bg-[linear-gradient(135deg,_rgba(59,130,246,0.95),_rgba(96,165,250,0.78))] px-8 py-10 text-white md:px-12 md:py-12"
          >
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/90">Responsabilidad y uso</p>
              <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                Apoyo a la decisión, no sustituto de la consulta oftalmológica
              </h2>
              <p className="mt-4 text-sm leading-7 text-sky-100/90 md:text-[0.95rem]">
                Los algoritmos ofrecen estimaciones y contrastes entre modelos; no certifican ausencia de patología ni sustituyen la exploración
                clínica. El uso adecuado del sistema (formación, flujos de tamizaje supervisado o investigación) depende de los protocolos
                de cada centro. El acceso autenticado habilita el entorno completo; la demostración, si está disponible, sirve para evaluación
                sin credenciales.
              </p>
            </div>

            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-xl sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={onEnterApp}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-primary shadow-lg transition hover:scale-[1.01] sm:flex-initial"
              >
                Acceder al entorno restringido
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={onEnterDemo}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-white/80 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:flex-initial"
              >
                <FlaskConical size={18} />
                Abrir demostración
              </button>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mt-8 max-w-2xl px-2 text-center text-xs leading-6 text-slate-500"
          >
            Documentación funcional y avisos legales concretos figuran en el repositorio y en el manual de usuario.{' '}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary-dark"
            >
              Volver al inicio de la página
            </button>
          </motion.p>
        </section>
      </main>
      </div>
    </div>
  );
}