"""
Cálculo del Cup-to-Disc Ratio (CDR) a partir de máscaras de segmentación.

CDR = área_copa / área_disco. Valores > 0.5–0.6 suelen asociarse a glaucoma.
El médico usa este ratio como signo clínico primario.
"""

import numpy as np
from typing import TypedDict


class CDRResult(TypedDict):
    cdr: float
    disc_area: float
    cup_area: float
    disc_diameter_equiv: float  # diámetro equivalente del disco (sqrt(4*area/pi))


def compute_cdr_from_masks(
    disc_mask: np.ndarray,
    cup_mask: np.ndarray,
) -> CDRResult:
    """
    Calcula el CDR a partir de máscaras binarias (disco y copa).

    Las máscaras deben ser del mismo tamaño; valores > 0 se consideran objeto.
    Se asume que la copa está contenida en el disco (no se valida).

    Returns:
        CDRResult con cdr, áreas y diámetro equivalente del disco.
    """
    disc_bin = (disc_mask > 0).astype(np.float64)
    cup_bin = (cup_mask > 0).astype(np.float64)

    disc_area = float(np.sum(disc_bin))
    cup_area = float(np.sum(cup_bin))

    if disc_area <= 0:
        return CDRResult(
            cdr=0.0,
            disc_area=0.0,
            cup_area=cup_area,
            disc_diameter_equiv=0.0,
        )

    cdr = cup_area / disc_area
    # Diámetro equivalente: círculo con la misma área
    disc_diameter_equiv = np.sqrt(4.0 * disc_area / np.pi)

    return CDRResult(
        cdr=round(cdr, 4),
        disc_area=disc_area,
        cup_area=cup_area,
        disc_diameter_equiv=round(disc_diameter_equiv, 2),
    )
