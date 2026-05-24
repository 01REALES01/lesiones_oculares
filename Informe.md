# Plataforma para la Identificación de Retinopatía Diabética en Imágenes de Fondo de Ojo con Modelos de Inteligencia Artificial

**Universidad Del Norte — Ingeniería en Sistemas y Computación — Proyecto Final — Informe Final**

**Autores:** Reales Jean, Angarita Diego, Guzmán Aura, Rodríguez Julio

**Asesores:** Augusto Salazar / Margarita Gamarra

---

## 1. Introducción

El presente proyecto nace de la necesidad de integrar la Inteligencia Artificial (IA) en el sector de la Salud Digital para cerrar las brechas de atención médica actuales. Hoy en día, el diagnóstico de patologías retinianas depende de la inspección manual de retinografías, un proceso lento que se ve agravado por la crítica escasez de especialistas en oftalmología, especialmente en zonas geográficamente remotas y rurales. Esta limitación en el acceso a centros especializados impide realizar un tamizaje preventivo oportuno, generando cuellos de botella en el sistema de salud y dejando a gran parte de la población vulnerable ante enfermedades que causan ceguera evitable.

Ante esta situación, se desarrollará una plataforma web diseñada para optimizar y agilizar este proceso, siendo una herramienta de uso exclusivo para el personal médico. El sistema integrará tres modelos de inteligencia artificial para asegurar la confiabilidad de los resultados, permitiendo detectar el grado de retinopatía diabética, según la escala ICDR. Esta solución no solo busca descentralizar el análisis médico, sino también mejorar la trazabilidad y la gestión de la información mediante un historial de análisis y métricas claras.

Es fundamental enfatizar que esta plataforma se propone como un avance tecnológico de apoyo clínico y educativo para facilitar la labor del profesional de la salud, y bajo ningún concepto busca reemplazar el juicio médico o el diagnóstico definitivo del experto. El objetivo final es proporcionar una herramienta que permita al personal médico priorizar la atención de pacientes y mejorar la capacidad de respuesta en regiones donde el recurso humano especializado es insuficiente o inexistente.

---

## 2. Marco conceptual

Para comprender adecuadamente la solución desarrollada en este proyecto, es fundamental definir los conceptos clínicos y tecnológicos que fundamentan la plataforma:

**Retinopatía Diabética (RD):** Es una complicación ocular de la diabetes causada por el daño a los vasos sanguíneos del tejido sensible a la luz en el fondo del ojo (retina). Es una de las principales causas de ceguera en adultos.

**Escala APTOS o ICDR:** El conjunto de datos APTOS 2019 Blindness Detection provee una escala estandarizada para clasificar la severidad de la retinopatía diabética en cinco grados: 0 (Sin RD), 1 (RD Leve), 2 (RD Moderada), 3 (RD Severa) y 4 (RD Proliferativa). Esta es la métrica clínica base que la plataforma busca detectar.

**Redes Neuronales Convolucionales (CNN):** Son una clase de redes neuronales artificiales profundas, aplicadas principalmente al análisis de imágenes visuales. Emplean una operación matemática llamada convolución en lugar de la multiplicación general de matrices, lo que les permite identificar patrones jerárquicos (bordes, texturas, lesiones) en las imágenes.

**DenseNet169:** (Densely Connected Convolutional Networks). Es una arquitectura donde cada capa está conectada a todas las demás capas posteriores. Esta estructura mejora significativamente la propagación del flujo de información y gradientes a lo largo de la red, mitigando el problema del desvanecimiento del gradiente y logrando alta precisión con menos parámetros.

**MobileNetV3:** Arquitectura ligera optimizada para dispositivos con recursos limitados. Combina eficiencia computacional con buena precisión para clasificación de imágenes.

**Xception:** (Extreme Inception). Es una arquitectura que reemplaza los módulos Inception estándar por convoluciones separables en profundidad (depthwise separable convolutions). Esto desacopla el mapeo de correlaciones cruzadas espaciales y de canales, haciendo el modelo estadísticamente más eficiente.

**Validación Cruzada por Conjunto (Ensemble/Concurrent Validation):** En lugar de depender de un solo modelo, la plataforma ejecuta inferencias en paralelo utilizando las tres arquitecturas mencionadas. Contrastar las salidas de modelos con diferentes aproximaciones matemáticas (densidad, residualidad y separabilidad) sobre la misma imagen médica aumenta la confianza clínica al buscar consensos y reducir falsos positivos.

---

## 3. Planteamiento del Problema

### 3.2 Restricciones y Supuestos de Diseño

1. **Disponibilidad y calidad del dataset:** El desarrollo de los modelos de inteligencia artificial depende de la disponibilidad de un conjunto amplio y representativo de retinografías etiquetadas. La precisión del sistema estará directamente condicionada por la calidad, diversidad y volumen de estos datos.
2. **Acceso a conocimiento especializado:** El diseño y validación de la solución requiere la colaboración con profesionales del área de la salud, particularmente especialistas en oftalmología, quienes proporcionarán criterios clínicos para el entrenamiento, interpretación de resultados y evaluación de la herramienta.
3. **Uso exclusivo por personal médico:** La plataforma está diseñada únicamente para ser utilizada por profesionales de la salud. Por lo tanto, la interfaz, funcionalidades y flujo de uso deben ajustarse a un contexto clínico y no a usuarios generales.
4. **Capacidad computacional disponible:** El entrenamiento y ejecución de modelos de inteligencia artificial para análisis de imágenes médicas requiere recursos computacionales significativos. El desempeño del sistema estará limitado por la infraestructura tecnológica disponible para el procesamiento de imágenes y ejecución de modelos.
5. **Privacidad y manejo de datos médicos:** El sistema debe manejar información sensible relacionada con pacientes e imágenes médicas, lo que impone restricciones en el almacenamiento, acceso y gestión de los datos para garantizar su confidencialidad.
6. **Tiempo de procesamiento de análisis:** La plataforma debe proporcionar resultados en un tiempo razonable para ser útil en un contexto clínico. Esto limita la complejidad de los modelos y los procesos de análisis implementados.

### 3.3 Alcance

**El proyecto incluye:**

1. **Levantamiento de Requerimientos:** Definición de las necesidades técnicas, funcionales y de seguridad para el manejo de imágenes médicas.
2. **Desarrollo de Plataforma Web (Front-end):** Una interfaz intuitiva que permita al personal médico cargar retinografías, visualizar los resultados del análisis y consultar un historial de lotes de inferencias.
3. **Arquitectura de Procesamiento Local:** Implementación de un entorno de ejecución local que permita procesar las imágenes utilizando los recursos del hardware disponible en el sitio.
4. **Integración de Tres Modelos de Inteligencia Artificial:** Implementación de tres arquitecturas diferentes para realizar validación cruzada.
5. **Módulo de Resultados y Métricas:** Entrega de indicadores técnicos y visualizaciones gráficas de los hallazgos realizados por la IA.
6. **Documentación Técnica:** Manual de usuario para el personal médico y documentación de la arquitectura del software.

**El proyecto no incluye:**

1. **Certificación Médica:** El software no se entregará como un dispositivo médico certificado ante entidades regulatorias.
2. **Diagnóstico Autónomo:** El sistema no reemplaza la firma de un especialista; es estrictamente una herramienta de apoyo.
3. **Integración con Historias Clínicas Reales:** No se conectará con bases de datos hospitalarias externas en esta fase del proyecto.
4. **Uso en Entornos Clínicos Reales:** El prototipo se limitará a entornos de prueba y experimentación educativa.

---

## 4. Objetivos

### Objetivo General

Diseñar e implementar una plataforma de software orientada al análisis de retinografías que integre una tríada de modelos de inteligencia artificial concurrentes, con el fin de proporcionar un análisis de validación cruzada de lesiones oculares asociadas a patologías como la Retinopatía Diabética. La plataforma permitirá al personal de salud obtener resultados desde tres perspectivas distintas de forma simultánea, facilitando la confirmación de hallazgos mediante la comparación de las salidas de cada modelo.

### Objetivos Específicos

1. **Desarrollo de una interfaz usable:** Diseñar e implementar una plataforma web con una interfaz intuitiva y accesible, orientada al personal médico. La interfaz deberá permitir la carga de retinografías, la ejecución automática de los modelos de análisis y la visualización clara de los resultados obtenidos.
2. **Integración de inteligencia artificial multi-modelo:** Implementar tres arquitecturas de IA especializadas que realicen un análisis en paralelo sobre la misma retinografía. Esta integración busca permitir al médico comparar los resultados de cada modelo para fortalecer la confiabilidad del diagnóstico preliminar mediante la identificación de coincidencias en los hallazgos.
3. **Trazabilidad y visualización de métricas:** Incorporar mecanismos que permitan registrar y almacenar el historial de análisis realizados dentro de la plataforma, junto con los resultados generados por los modelos de inteligencia artificial. Además, el sistema deberá mostrar indicadores de desempeño relevantes, como precisión y sensibilidad, con el fin de facilitar la interpretación de los resultados y permitir una evaluación clara del comportamiento de los modelos utilizados.

---

## 5. Estado del Arte / Soluciones Relacionadas

El diagnóstico de patologías oculares mediante inteligencia artificial ha experimentado una evolución disruptiva en la última década, pasando de algoritmos de visión computacional clásicos a arquitecturas de Aprendizaje Profundo de extremo a extremo. El estado actual de la técnica se define por los siguientes pilares:

**1. Aprendizaje por Transferencia**

La tendencia predominante en el estado del arte no es el entrenamiento de modelos desde cero, sino el uso de arquitecturas pre-entrenadas en bases de datos masivas (como ImageNet). Arquitecturas modernas como MobileNetV3, Xception y EfficientNet optimizan la relación entre número de parámetros y precisión, permitiendo operar modelos de alta fidelidad en dispositivos con recursos limitados.

**2. Validación por Ensamble de Modelos**

Uno de los mayores retos en la medicina actual es la confiabilidad de los sistemas automatizados. El estado del arte aborda este problema mediante el uso de ensambles (ensembles) o la ejecución concurrente de diferentes arquitecturas neuronales. Al contrastar resultados de modelos matemáticamente diferentes (como DenseNet y MobileNetV3), se reduce la incertidumbre propia de un solo modelo ("caja negra"), validando el criterio ante el especialista humano.

**3. Especialización y Profundidad en la Clasificación**

La investigación actual se ha desplazado hacia redes extremadamente profundas y eficientes para tareas clínicas de alta complejidad, como determinar el grado de severidad de la Retinopatía Diabética (escala ICDR o APTOS). Las arquitecturas modernas priorizan una clasificación robusta y precisa, optimizando el entrenamiento con técnicas de preprocesamiento avanzadas específicas para fondos de ojo.

**4. Bibliotecas y Frameworks de Alto Rendimiento**

A nivel de implementación, el estándar industrial se ha consolidado en torno a TensorFlow y PyTorch para el entrenamiento de modelos, y FastAPI para el despliegue de microservicios. La integración de estos modelos en aplicaciones web modernas mediante React permite que herramientas de alta complejidad matemática sean accesibles para el personal médico mediante interfaces intuitivas y reactivas, facilitando la telemedicina en tiempo real.

**5. Datasets Estándar y Evaluación**

La validación de estos sistemas se apoya hoy en día en conjuntos de datos abiertos y etiquetados por expertos, como el dataset APTOS 2019 y EyePACS. Las métricas de éxito han evolucionado más allá del simple Accuracy, utilizando ahora el Kappa de Cohen Cuadrático (QWK) para medir el acuerdo entre la IA y los médicos, penalizando más fuertemente los errores en grados de severidad distantes.

---

## 6. Requerimientos

### 6.1 Funcionales

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RF01 | Carga de imagen de retinografía (formatos habituales: jpg, png) | Alta |
| RF02 | Ejecución de inferencia en paralelo utilizando los tres modelos de IA sobre la imagen cargada | Alta |
| RF03 | Visualización comparativa de resultados: el sistema mostrará las salidas de los tres modelos de forma simultánea para permitir la validación cruzada por parte del médico | Alta |
| RF04 | Historial básico: listado de análisis recientes con posibilidad de ver detalle de cada uno | Alta |
| RF05 | Trazabilidad: cada inferencia con ID único, timestamp, modelos usados y tiempos de ejecución | Alta |
| RF06 | Postprocesamiento: etiquetas legibles, probabilidades y datos cuantitativos| Media |
| RF07 | Evaluación con dataset: script que calcule métricas (accuracy, F1, AUC, sensibilidad, especificidad) y tiempos de inferencia; comparación entre modelos | Media |
| RF08 | Gestión de usuarios (opcional): registro/login para asociar análisis a usuario | Baja |

### 6.2 No Funcionales

**Usabilidad**
- Interfaz web clara: pasos identificables (cargar imagen → analizar → ver resultados).
- Resultados presentados de forma ordenada: métricas, gráficas y texto de recomendación.
- Aviso visible de que el sistema es de apoyo clínico/educativo y no diagnóstico.

**Rendimiento**
- Tiempos de inferencia razonables.
- Historial acotado en páginas (p. ej. últimos N registros) para no degradar el servicio.

**Seguridad y privacidad**
- Seguridad de acceso local y cifrado de base de datos interna.
- Control de acceso al API (y a datos sensibles).
- Retención mínima de imágenes/inferencias; opción de no persistir imágenes y solo guardar resultados agregados o anonimizados.
- No certificación como dispositivo médico en el alcance actual.

**Mantenibilidad y despliegue**
- Código modular (preprocesamiento, modelos, postprocesamiento, almacenamiento).
- Prototipo desplegable en local (Docker/docker-compose).
- Documentación técnica y manual de usuario.

**Riesgos y mitigaciones**

| Riesgo | Mitigación |
|--------|------------|
| Calidad variable de imágenes | Se implementa preprocesamiento; se documentan limitaciones |
| Desbalance/sesgos en datos | Se realiza evaluación con dataset público o provisto; se reportan métricas en script de evaluación |
| Confiabilidad de resultados | Ejecución concurrente de tres arquitecturas diferentes (DenseNet, MobileNetV3, Xception) para validación cruzada |
| Latencia y recursos | Se cargan los modelos ya preentrenados; se muestra un historial acotado |
| Privacidad de imágenes médicas | Se implementa cifrado, control de acceso, retención mínima, anonimización donde aplique |
| Uso indebido como diagnóstico | Disclaimers en API e interfaz; enfoque "apoyo/tamizaje"; trazabilidad |
| Alcance excesivo | Se definen claramente salidas por modelo y lesiones consideradas |

---

## 7. Diseño y Arquitectura

La solución se estructuró como una plataforma web modular para análisis de retinografías orientada a apoyo clínico y educativo. A nivel conceptual, el sistema separa claramente la interacción con el usuario, la lógica de negocio, el procesamiento de imágenes, la inferencia con modelos de IA y la persistencia de resultados. Esta separación reduce acoplamiento, facilita mantenimiento y permite evolucionar cada módulo sin reescribir toda la solución. A nivel técnico, la plataforma adopta una arquitectura cliente-servidor con frontend web, API backend, pipeline de procesamiento e inferencia, y un mecanismo de trazabilidad e historial.

### 7.1 Evaluación de Alternativas

Para el diseño de la solución se evaluaron alternativas tecnológicas y de enfoque, priorizando coherencia clínica, facilidad de mantenimiento y desempeño en inferencia.

- **Frontend:** Se consideró implementar una interfaz básica de análisis secuencial (modelo por modelo) frente a un dashboard comparativo en una sola ejecución. Se seleccionó el dashboard comparativo porque permite elegir 1, 2 o 3 modelos de manera simultánea, visualizar resultados lado a lado y tomar decisiones de forma más eficiente en contexto de tamizaje.

- **Backend:** Se evaluó mantener un flujo rígido por endpoint (un endpoint por modelo) frente a un endpoint orquestador único. Se eligió un backend orquestador porque simplifica la integración del frontend, unifica la trazabilidad y permite agregar o retirar modelos sin cambiar el flujo principal de la aplicación.

- **Modelos de IA:** Se evaluaron tres modelos para la misma patología (retinopatía diabética), en lugar de mezclar patologías distintas. Esta decisión garantiza una comparación homogénea y técnicamente válida entre modelos, usando los mismos datos de entrada y métricas comparables. Los criterios de evaluación definidos fueron sensibilidad, especificidad, F1-score, AUC, tiempo de inferencia y confianza de predicción.

- **Autenticación y persistencia:** Se definió una estrategia de integración directa con los servicios institucionales: autenticación mediante **ROBLE Auth** (con validación de tokens JWT) y almacenamiento de trazabilidad de inferencias en **ROBLE Database**. Esto garantiza centralización y seguridad acorde a los estándares del entorno operativo.

- **Exportación de resultados:** Se implementó una exportación de datos estructurados para análisis técnico y validación interna en formato CSV/Excel.

Como resultado de esta evaluación, se seleccionó una arquitectura modular con frontend comparativo, backend orquestador y tres modelos enfocados exclusivamente en retinopatía diabética.

### 7.2 Arquitectura

La solución se orienta exclusivamente a la detección de retinopatía diabética (RD). El sistema no mezcla patologías distintas, sino que compara tres modelos de inteligencia artificial entrenados para la misma tarea clínica: clasificar si el paciente presenta o no retinopatía diabética y estimar su severidad. Desde el dashboard, el usuario puede ejecutar uno, dos o los tres modelos en una sola corrida para contrastar resultados, confianza y tiempos de inferencia.

#### 7.2.1 Descripción General de la Arquitectura

La plataforma adopta una arquitectura **cliente-servidor** con los siguientes niveles:

- **Capa de Aplicación (Frontend)**
- **Lógica de Negocio (Backend API)** 
- **Pipeline de IA** 
- **Persistencia y Autenticación**

#### 7.2.2 Componentes del Sistema e Interacción

##### 7.2.2.1 Descripción de Componentes

**1. Frontend Web (React + Vite)**
- Carga de retinografías.
- Selección de modelos (Modelo 1, Modelo 2, Modelo 3) para análisis comparativo.
- Visualización unificada de resultados por modelo: diagnóstico RD (sí/no), grado de severidad, confianza.
- Consulta de historial y detalle de inferencias.

**2. Backend API (FastAPI)**
- Recibe imagen y modelos seleccionados.
- Orquesta ejecución de uno o varios modelos en una sola solicitud.
- Estandariza salidas para que los tres modelos se comparen en el mismo formato.
- Registra trazabilidad de cada inferencia (modelo usado, timestamp, tiempo, resultado).

**3. Motor de Modelos IA**
- Modelo 1 de clasificación RD.
- Modelo 2 de clasificación RD.
- Modelo 3 de clasificación RD.
- Todos se enfocan en la misma patología para permitir comparación homogénea.

**4. Postprocesamiento y Trazabilidad**
- Normaliza salidas de los modelos (diagnóstico, probabilidad, grado).
- Construye respuesta comparativa para la interfaz.
- Guarda historial de análisis para auditoría y seguimiento.

**Responsabilidades por componente:**

| Componente | Responsabilidad |
|---|---|
| Frontend | Interacción y comparación visual |
| Backend | Orquestación, seguridad, validación y trazabilidad |
| Modelos IA | Inferencia de retinopatía diabética |
| Persistencia | Almacenamiento de resultados y metadatos de ejecución |

##### 7.2.2.2 Interacción entre Módulos

El flujo de comunicación entre componentes es el siguiente:

1. Usuario carga imagen y selecciona 1, 2 o 3 modelos.
2. Frontend envía solicitud al backend con imagen + lista de modelos.
3. Backend preprocesa y ejecuta los modelos seleccionados.
4. Backend recibe salidas, las normaliza y arma respuesta comparativa.
5. Backend guarda la inferencia en historial.
6. Frontend muestra comparación: presencia/ausencia de RD, severidad y confianza por modelo.

Los módulos se comunican mediante HTTP (multipart para envío de imágenes). El backend actúa como orquestador central, reduciendo el acoplamiento entre el frontend y los modelos de IA.
<img width="856" height="620" alt="image" src="https://github.com/user-attachments/assets/5dbf4073-6192-478d-8216-b65382166d98" />


##### 7.2.2.3 Comportamiento

La arquitectura responde favorablemente a las siguientes preguntas de diseño:

- **¿El flujo es eficiente?** Sí. La ejecución de modelos es paralela dentro del backend orquestador, reduciendo el tiempo total de inferencia respecto a un enfoque secuencial.
- **¿Existen pasos innecesarios?** No. El pipeline sigue directamente: carga → preprocesamiento → inferencia → postprocesamiento → respuesta.
- **¿Hay problemas de latencia?** Se mitigan con carga de modelos preentrenados y restricción del historial en memoria.
- **¿Existen cuellos de botella?** El modelo más lento en una ejecución paralela define el tiempo total; se documenta en métricas de trazabilidad.
- **¿La interacción refleja un buen desacoplamiento?** Sí. Frontend y modelos de IA no se conocen directamente; toda comunicación pasa por la API orquestadora.

Los diagramas de secuencia cubren dos flujos principales: el proceso de autenticación de usuario (login → token JWT → acceso al dashboard) y el proceso de análisis de retinografías (carga de imagen → selección de modelos → inferencia paralela → postprocesamiento → visualización comparativa).

---

## 8. Implementación

La implementación actual del proyecto está orientada a soportar un flujo funcional completo de análisis de retinografías, con autenticación, ejecución de inferencia, visualización de resultados y trazabilidad. El avance técnico ya permite operar el sistema de extremo a extremo en entorno local, con capacidad de comparación entre modelos y registro de inferencias para seguimiento.

### 8.1 Stack Tecnológico

**Backend**
- **Python** — lenguaje principal para lógica de negocio e inferencia.
- **FastAPI** — exposición de servicios REST por su desempeño, tipado y documentación automática.
- **Uvicorn** — servidor ASGI para ejecución del backend.
- **Pydantic** — validación de datos de entrada/salida.
- **Python-JOSE / Passlib** — autenticación basada en JWT.
- **NumPy** — manejo de arreglos.
- **OpenCV / Pillow** — lectura, transformación y preprocesamiento de retinografías.
- **Scikit-image** — utilidades de procesamiento de imágenes.
- **TensorFlow CPU / tf_keras** — carga y ejecución de modelos de deep learning.
- **Scikit-learn** — métricas de evaluación.

**Frontend**
- **React** — construcción de interfaz basada en componentes.
- **Vite** — desarrollo y build rápido del cliente web.
- **Axios** — consumo de API.
- **Framer Motion** — animaciones de UI.
- **Tailwind CSS** — estilos y consistencia visual.
- **Lucide React** — iconografía.

**Despliegue y operación**
- **Docker / Docker Compose** — ejecución reproducible de frontend y backend.
- **Scripts de arranque** (Windows y Bash) — automatizan instalación y levantamiento de servicios.

**Justificación general del stack:** se eligió un stack web moderno y modular, con separación clara entre cliente, API e inferencia. El backend soporta escalabilidad funcional sin cambiar la interfaz, y el frontend permite evolucionar la experiencia de usuario y visualización comparativa sin afectar el núcleo de IA.

### 8.2 Componentes

**1. Componente de autenticación**
- Login de usuarios con emisión de token JWT.
- Protección de endpoints de análisis e historial.
- Gestión de sesión desde frontend mediante token en cabeceras.

**2. Componente de carga y análisis**
- Recepción de una o múltiples retinografías.
- Selección de modelos de análisis desde interfaz.
- Orquestación de inferencia en backend según modelos seleccionados.
- Soporte de análisis demo especializado para flujo DenseNet.

**3. Componente de preprocesamiento e inferencia**
- Preprocesamiento previo a inferencia para normalizar entrada.
- Ejecución de modelos de IA y recuperación de predicciones estructuradas.
- Soporte de fallback cuando un modelo no está disponible.

**4. Componente de postprocesamiento y comparación**
- Consolidación de resultados por inferencia.
- Cálculo y exposición de métricas por modelo (tiempos, confianza, probabilidad/grado).
- Preparación de respuesta legible para visualización clínica de apoyo.

**5. Componente de visualización**
- Dashboard principal para carga y ejecución de análisis.
- Vista de detalle con diagnóstico, confianza, probabilidades y trazabilidad.
- Historial de inferencias para consulta posterior.
- Exportación de resultados en formato estructurado.

**6. Componente de trazabilidad**
- Registro de identificador único por inferencia.
- Registro de timestamp, modelos utilizados y tiempos de inferencia.
- Consulta de historial y detalle por inferencia.

**Flujo de interacción entre componentes:**

El usuario opera en el frontend → el frontend invoca la API protegida → la API ejecuta preprocesamiento + modelos seleccionados → el backend consolida resultados y guarda trazabilidad → el frontend presenta resultados comparativos e historial.

### 8.3 Integraciones

**1. Integración Frontend-Backend**
- **Estado:** implementada y operativa.
- Comunicación HTTP con envío de archivos (multipart) y parámetros de modelos.
- Proxy de desarrollo configurado para enrutar llamadas del cliente a la API.

**2. Integración de autenticación**
- **Estado:** implementada y operativa usando **ROBLE Auth**.
- Funciona para inicio de sesión, verificación de roles (admin/user) y protección de rutas mediante tokens JWT.
- Se valida contra los servicios institucionales para robustecer la seguridad y el acceso autorizado.

**3. Integración de persistencia**
- **Estado:** implementada e integrada con **ROBLE Database** para trazabilidad de inferencias y consulta de historial.
- Se registran metadatos de ejecución (modelos usados, timestamps) y resultados (diagnóstico, confianza).
- No se plantea almacenamiento permanente de imágenes clínicas como requisito base.

**4. Integración de modelos de IA**
- **Estado:** implementada para ejecución de modelos disponibles en entorno local.
- Flujo de inferencia funcional con respuesta estructurada para frontend.
- Existe manejo de contingencia cuando un modelo no puede cargarse.

**5. Integración de despliegue**
- **Estado:** operativa en entorno local.
- Ejecución posible con scripts de arranque y también con contenedores Docker.
- El sistema puede levantarse en equipos diferentes con pasos estandarizados.

---

## 9. Despliegue y Operación

La plataforma está diseñada para ejecutarse en entorno local mediante contenedores Docker, garantizando reproducibilidad independientemente del sistema operativo del equipo anfitrión.

**Infraestructura y dependencias**
- Docker y Docker Compose para orquestar los servicios de frontend y backend.
- Scripts de arranque disponibles para Windows (`.ps1`) y sistemas Unix/Bash, que automatizan la instalación de dependencias y el levantamiento de los servicios.
- El backend requiere Python con las librerías especificadas en el stack tecnológico; el frontend se construye con Node.js/Vite dentro del contenedor.

**Puesta en marcha**
1. Clonar el repositorio del proyecto.
2. Ejecutar el script de arranque correspondiente al sistema operativo, o levantar los servicios con `docker-compose up`.
3. El frontend queda disponible en el puerto configurado del navegador local; el backend expone la API REST en su puerto designado.
4. Para entornos sin Docker, se pueden instalar las dependencias manualmente y ejecutar el backend con `uvicorn` y el frontend con `vite dev`.

**Condiciones de operación**
- El sistema opera completamente en local; no requiere conexión a servicios externos en la fase actual.
- La autenticación se gestiona mediante JWT local; no se necesita configuración de servicios en la nube para el prototipo base.
- Los modelos de IA deben estar presentes en el directorio de modelos configurado antes de iniciar el backend; existe un mecanismo de fallback si alguno no está disponible.
- El historial de inferencias se almacena localmente y está acotado para no degradar el rendimiento del servicio.

---

## 10. Validación

El plan de pruebas define la estrategia para verificar que la plataforma de análisis de retinografías funciona correctamente y cumple con los requerimientos funcionales y no funcionales establecidos.

### 10.1 Pruebas por Componentes

Se evaluaron individualmente los módulos principales del sistema: frontend, backend y modelos de inteligencia artificial.

**1. Módulo de carga de imágenes (Frontend)**

- **Descripción:** Verificar que el usuario puede cargar imágenes en formatos válidos.
- **Casos de prueba:**
  - Carga de imagen JPG válida.
  - Carga de imagen PNG válida.
  - Intento de carga de archivo no permitido (PDF, TXT).
- **Criterio de éxito:** El sistema acepta formatos válidos y rechaza los inválidos con un mensaje claro.

**2. Módulo de procesamiento (Backend - FastAPI)**

- **Descripción:** Validar la recepción y procesamiento de imágenes.
- **Casos de prueba:**
  - Envío correcto de imagen desde frontend.
  - Manejo de errores (imagen corrupta o vacía).
- **Criterio de éxito:** El backend procesa correctamente la imagen o devuelve errores controlados.

**3. Módulo de inferencia (Modelos IA)**

- **Descripción:** Verificar ejecución de los tres modelos en paralelo.
- **Casos de prueba:**
  - Ejecución con imagen válida.
  - Comparación de salidas entre modelos.
- **Criterio de éxito:** Los tres modelos retornan resultados sin fallos y en tiempos aceptables (menos de 2–3 segundos para 10 fotos con un solo modelo; menos de 8–10 segundos para 10 fotos con los 3 modelos).

**4. Módulo de resultados**

- **Descripción:** Validar la generación de salidas (probabilidades, etiquetas, métricas).
- **Casos de prueba:**
  - Visualización de probabilidades.
  - Generación de gráficos.
- **Criterio de éxito:** Resultados claros, completos y correctamente estructurados.

**5. Módulo de historial**

- **Descripción:** Verificar almacenamiento de análisis.
- **Casos de prueba:**
  - Registro de nueva inferencia.
  - Consulta de historial.
- **Criterio de éxito:** Cada análisis queda registrado con ID, fecha y resultados.

**6. Módulo de login**

- **Descripción:** Verificar login del sistema.
- **Casos de prueba:**
  - Registrar credenciales correctas de un usuario.
  - Registrar credenciales incorrectas de un usuario.
- **Criterio de éxito:** Dar acceso al sistema al usuario válido y mostrar un mensaje de error al usuario no válido.

### 10.2 Pruebas de Integración

Se evaluó la interacción entre los distintos componentes del sistema.

**1. Integración frontend-backend**
- **Casos de prueba:** Envío de solicitudes HTTP correctas; manejo de respuestas del API.
- **Criterio de éxito:** Comunicación fluida sin pérdida de datos.

**2. Manejo de errores**
- **Casos de prueba:** Backend caído; timeout en modelos.
- **Criterio de éxito:** El sistema muestra mensajes claros sin colapsar.

**3. Integración con almacenamiento (historial)**
- **Casos de prueba:** Guardado automático tras análisis.
- **Criterio de éxito:** No se pierde información entre módulos.

**4. Flujo completo del sistema**
- **Casos de prueba:**
  1. Usuario carga imagen.
  2. Backend la recibe.
  3. Modelos procesan.
  4. Resultados se muestran.
- **Criterio de éxito:** El flujo completo se ejecuta sin errores y en orden correcto.

### 10.3 Pruebas de Usabilidad

Se evaluó la experiencia del usuario (personal médico).

**Metodología**
- Pruebas con usuarios simulados (compañeros).
- Ejecución de tareas típicas: cargar imagen, analizar, revisar resultados.

**Aspectos evaluados**
- Facilidad de uso.
- Claridad de la interfaz.
- Tiempo de respuesta.
- Comprensión de resultados.

**Casos de prueba**
- Usuario realiza análisis sin instrucciones previas.
- Usuario interpreta resultados generados por el sistema.

**Criterios de aceptación**
- El usuario puede completar el flujo sin ayuda externa.
- Los resultados son comprensibles.
- El tiempo de respuesta de la aplicación es adecuado (menos de 2 segundos por acción).
- La interfaz es clara y organizada.

---

## Referencias

1. V. Gulshan et al., "Development and Validation of a Deep Learning Algorithm for Detection of Diabetic Retinopathy in Retinal Fundus Photographs," *JAMA*, vol. 316, no. 22, pp. 2402–2410, Dec. 2016.
2. World Health Organization, "Diabetes," Sep. 2023. [Online]. Available: https://www.who.int/news-room/fact-sheets/detail/diabetes
3. S. Tiangolo, "FastAPI framework, high performance, easy to learn, fast to code, ready for production," 2024. [Online]. Available: https://fastapi.tiangolo.com/
4. M. Abadi et al., "TensorFlow: A System for Large-Scale Machine Learning," in *12th USENIX Symposium on Operating Systems Design and Implementation (OSDI 16)*, 2016, pp. 265–283.
5. E. Carrero, "Formulación del problema en tesis de grado," Todo Sobre Tesis, 2021. [Online]. Available: https://todosobretesis.com/formulacion-del-problema-en-tesis-degrado/
6. J. Martins, "Cómo redactar objetivos de un proyecto que sean eficaces," Asana, 2020. [Online]. Available: https://asana.com/es/resources/how-project-objectives
7. D. S. Kermany et al., "Identifying Medical Diagnoses and Guide Treatment Potential through Training-Based Deep Learning on Common Illumination-Voxel Images," *Cell*, vol. 172, no. 5, pp. 1122–1131, Feb. 2018.
8. F. Chollet, *Deep Learning with Python*, 2nd ed., Shelter Island, NY: Manning Publications, 2021.
9. International Organization for Standardization, "Health informatics — Information security controls in health based on ISO/IEC 27002," ISO 27799:2025, 2025.
