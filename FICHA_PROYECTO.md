# Ficha del Proyecto

> **Instrucción:** Completar con los datos reales del grupo y del curso. Si ya tienen la ficha en Word/PDF, pueden copiar aquí el contenido y conservar este formato Markdown para facilitar la lectura en GitHub.

---

## Datos generales

| Campo | Valor |
|-------|--------|
| **Nombre del proyecto** | Análisis de fondo de ojo (fundus) para apoyo al diagnóstico oftalmológico |
| **Curso / asignatura** | Proyecto Final |
| **Institución** | Universidad del Norte|
| **Tutor** | Margarita Gamarra |

---

## Integrantes del grupo

| Nombre | Rol / responsabilidad | Contacto (opcional) |
|--------|------------------------|----------------------|
| Julio Rodriguez | Frontend | [Email o usuario GitHub] |
| Aura Guzman | [Ej.: Preprocesamiento / documentación] | |
| Diego Angarita | Backend | |
| Jean Paul Reales| | |

---

## Descripción breve del proyecto

Desarrollamos un sistema de análisis de **fotografía de fondo de ojo** que combina:

- Preprocesamiento específico para imágenes de retina (canal verde, CLAHE, Ben Graham).
- Segmentación del disco y la copa óptica para el cálculo del **CDR (Cup-to-Disc Ratio)**.
- Clasificación de riesgo de **glaucoma** y detección de **lesiones** (microaneurismas, hemorragias, exudados).
- Explicabilidad mediante mapas de calor (XAI).

Todo ello lo exponemos mediante una **API REST** (FastAPI) para su integración en flujos de trabajo clínicos.

---

## Objetivos

- [x] Diseñar e implementar el pipeline de preprocesamiento y los módulos de segmentación, clasificación y detección.
- [x] Integrar los resultados en una API única (`/analyze-retina/`) con respuesta estructurada y heatmap.
- [x] Documentar el diseño en la carpeta `/diseno` y el Informe 1 en el README principal.
- [x] Conectar modelos reales (ONNX) y desarrollar interfaz web.

---

## Entregables previstos

- Código del backend (FastAPI + preprocesamiento + modelos/stubs).
- Repositorio en GitHub con estructura `/diseno`, README (Introducción, Problema, Restricciones, Alcance) y esta ficha en Markdown.
- Documentos de avance según cronograma del curso (Informe 1 y siguientes).
- Frontend web (React) con carga de imagen, selección de modelos y visualización de resultados.
- Script de evaluación con métricas y comparación entre modelos.
- Prototipo desplegable con Docker.

---

## Enlace al repositorio

**URL del repositorio en GitHub:** https://github.com/01REALES01/lesiones_oculares.git

> Recordatorio: agregamos el link también en el Excel de grupos de trabajo, en la columna correspondiente. Todos los integrantes de nuestro grupo, el tutor y el profesor están como colaboradores del repositorio.
