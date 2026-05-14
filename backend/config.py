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
    anthropic_api_key: str = ""

    #ROBLE
    roble_auth_base: str = "https://roble-api.openlab.uninorte.edu.co/auth"
    roble_db_name: str = "ocularai_fa7b13fe81"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
