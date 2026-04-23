import os
import io
import numpy as np

# TF_USE_LEGACY_KERAS=1 solo es válido si existe el paquete `tf_keras` (requirements.txt).
# Sin él, TensorFlow falla al importar con "Keras cannot be imported".
try:
    import tf_keras  # noqa: F401
    os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
except ImportError:
    os.environ["TF_USE_LEGACY_KERAS"] = "0"

import tensorflow as tf
from PIL import Image

# Mixed precision (si falla en algún entorno, seguimos sin bloquear el arranque)
try:
    tf.keras.mixed_precision.set_global_policy("mixed_float16")
except Exception:
    pass

class MLManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLManager, cls).__new__(cls)
            cls._instance._init_manager()
        return cls._instance

    def _init_manager(self):
        self.models = {}
        self.models_dir = os.path.join(os.path.dirname(__file__), "models")
        
        # Clinical descriptions mapping for Diabetic Retinopathy (APTOS classes)
        self.class_descriptions = {
            0: "No DR - Retina sana, sin hallazgos patológicos.",
            1: "DR Leve - Presencia de microaneurismas aislados.",
            2: "DR Moderada - Microaneurismas, exudados duros/blandos, opcionalmente pequeñas hemorragias retinianas.",
            3: "DR Severa - Más de 20 hemorragias intrarretinianas, arrosariamiento venoso o anomalías microvasculares intrarretinianas (AMIR).",
            4: "DR Proliferativa - Neovascularización, hemorragia vítrea o hemorragia prerretiniana presentes."
        }

    def _resolve_target_size(self, model_key: str, target_size=None):
        """
        Devuelve el tamaño de entrada correcto para el modelo.
        Si no se especifica target_size, se infiere desde model.input_shape.
        """
        if target_size is not None:
            return target_size

        model = self.models.get(model_key)
        if model is None:
            return (224, 224)

        shape = getattr(model, "input_shape", None)
        if isinstance(shape, list):
            shape = shape[0]

        if shape and len(shape) >= 3 and shape[1] and shape[2]:
            return (int(shape[1]), int(shape[2]))

        return (224, 224)

    def load_model(self, model_key: str, filename: str):
        """
        Carga un modelo de Keras (.keras o .h5) en la memoria gráfica de forma perezosa.
        """
        if model_key in self.models:
            return  # The model is already loaded

        filepath = os.path.join(self.models_dir, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"El archivo de modelo no se encontró en: {filepath}. Súbelo a la carpeta backend/models.")

        print(f"Cargando modelo '{model_key}' desde disco...")
        try:
            # We try to load without optimizer for inference efficiency
            self.models[model_key] = tf.keras.models.load_model(filepath, compile=False)
            print(f"Modelo '{model_key}' cargado exitosamente.")
        except Exception as e:
            print(f"Error al cargar '{model_key}': {str(e)}")
            raise e

    def preprocess_image(self, image_bytes: bytes, target_size=(224, 224), model_type="resnet50"):
        """
        Convierte bytes de imagen a un tensor procesado listo para el modelo Keras.
        """
        # Open image from bytes
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize(target_size)
        
        # Convert to numpy array
        img_array = np.array(image, dtype=np.float32)

        # Apply specific preprocessing based on the model architecture trained in the notebooks
        if model_type == "resnet50" or model_type == "resnet50v2":
            img_array = tf.keras.applications.resnet_v2.preprocess_input(img_array)
        elif model_type == "densenet169":
            img_array = tf.keras.applications.densenet.preprocess_input(img_array)
        elif model_type == "mobilenetv3":
            img_array = tf.keras.applications.mobilenet_v3.preprocess_input(img_array)
        elif model_type == "xception":
            img_array = tf.keras.applications.xception.preprocess_input(img_array)
        elif model_type == "efficientnet":
            img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)
        else:
            # Generic fallback: Normalize [0..255] to [0..1]
            img_array = img_array / 255.0

        return img_array

    def predict_batch(self, model_key: str, images_bytes_list: list, target_size=None, model_type="resnet50"):
        """
        Procesa un lote de imágenes en un solo pase hacia la tarjeta gráfica o CPU usando Tensor Stacking.
        """
        if model_key not in self.models:
            raise Exception(f"Modelo '{model_key}' no está pre-cargado. Llame a load_model primero.")

        target_size = self._resolve_target_size(model_key, target_size)

        # 1. Preprocess every image individually 
        preprocessed_images = []
        for img_bytes in images_bytes_list:
            array = self.preprocess_image(img_bytes, target_size=target_size, model_type=model_type)
            preprocessed_images.append(array)

        # 2. Stack them into a single batch tensor: shape (batch_size, 224, 224, 3)
        batch_tensor = np.stack(preprocessed_images)

        # 3. Model Inference (Batch processing is extremely fast here compared to 1 by 1)
        predictions = self.models[model_key].predict(batch_tensor, verbose=0)

        # 4. Post-processing to structured JSON output
        results = []
        for idx, probs in enumerate(predictions):
            predicted_class = int(np.argmax(probs))
            confidence = float(np.max(probs)) * 100
            
            # Map values to clinical diagnosis
            diagnosis = "Normal" if predicted_class == 0 else "Anómalo"
            if predicted_class > 0:
                diagnosis = f"Retinopatía (Grado {predicted_class})"

            results.append({
                "model_used": model_key,
                "predicted_class": predicted_class,
                "confidence_percent": round(confidence, 2),
                "diagnosis": diagnosis,
                "clinical_description": self.class_descriptions.get(predicted_class, "Class desconocida"),
                "raw_probabilities": [round(float(p)*100, 2) for p in probs]
            })

        return results
    
    def predict_single(self, model_key: str, image_bytes: bytes, target_size=None, model_type="densenet169"):
        """
        Procesa una sola imagen con el modelo especificado.
        """
        if model_key not in self.models:
            raise Exception(f"Modelo '{model_key}' no está pre-cargado. Llame a load_model primero.")

        target_size = self._resolve_target_size(model_key, target_size)

        # Preprocess imagen
        img_array = self.preprocess_image(image_bytes, target_size=target_size, model_type=model_type)
        
        # Agregar dimensión batch: (224, 224, 3) -> (1, 224, 224, 3)
        batch_tensor = np.expand_dims(img_array, axis=0)

        # Model Inference
        predictions = self.models[model_key].predict(batch_tensor, verbose=0)
        probs = predictions[0]

        # Post-processing
        predicted_class = int(np.argmax(probs))
        confidence = float(np.max(probs)) * 100

        diagnosis = "Normal" if predicted_class == 0 else "Anómalo"
        if predicted_class > 0:
            diagnosis = f"Retinopatía (Grado {predicted_class})"

        return {
            "model_used": model_key,
            "predicted_class": predicted_class,
            "confidence_percent": round(confidence, 2),
            "diagnosis": diagnosis,
            "clinical_description": self.class_descriptions.get(predicted_class, "Class desconocida"),
            "raw_probabilities": [round(float(p)*100, 2) for p in probs]
        }

# Exponer la instancia singleton para la app entera
ml_manager = MLManager()
