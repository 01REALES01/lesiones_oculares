"""Configuración de la aplicación."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Variables de entorno y configuración."""

    app_name: str = "Fundus Analysis API"
    debug: bool = False
    # Rutas a modelos (ONNX/Triton) cuando estén listos
    model_segmentation_path: str = ""
    model_classifier_path: str = ""
    model_detector_path: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
