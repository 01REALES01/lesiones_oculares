# Segmentación de Disco Óptico y Copa Óptica — CDR

## Explicación del tema

El **disco óptico** es la zona por donde el nervio óptico sale de la retina; en su interior aparece una zona más clara llamada **copa óptica** (excavación fisiológica). En **glaucoma**, la copa se agranda respecto al disco. El indicador clave es el **CDR (Cup-to-Disc Ratio)**:

- **CDR = área_copa / área_disco** (o a veces se usa el ratio de diámetros verticales).
- Valores de CDR > 0.5–0.6 se asocian a sospecha de glaucoma y se usan en cribado.

Para obtener el CDR de forma automática se requiere **segmentar** en la imagen de fundus:
1. La región del **disco óptico**
2. La región de la **copa óptica**

Arquitecturas típicas son **U-Net**, **U-Net++** y **DeepLabV3+**, entrenadas con máscaras de disco y copa (datasets como REFUGE, RIM-ONE, etc.). A partir de las máscaras se calcula el CDR de forma numérica.

## Enlaces relevantes

- [REFUGE Challenge - Segmentación disco/copa](https://refuge.grand-challenge.org/)
- [U-Net: Convolutional Networks for Biomedical Image Segmentation](https://arxiv.org/abs/1505.04597)
- [DeepLabV3+ - Encoder-Decoder with Atrous Separable Convolution](https://arxiv.org/abs/1802.02611)
- [Cup-to-Disc Ratio - revisión clínica](https://www.aao.org/education/image/cup-to-disc-ratio)

## Códigos de prueba (si aplica)

En el proyecto:

- `backend/models/segmentation_vnet.py` — interfaz de segmentación (stub con máscaras dummy; sustituir por modelo real).
- `backend/models/cdr.py` — cálculo del CDR a partir de máscaras binarias.

Ejemplo de cálculo de CDR dadas dos máscaras:

```python
from backend.models.cdr import compute_cdr_from_masks
import numpy as np

disc_mask = np.load("mascara_disco.npy")  # binaria
cup_mask = np.load("mascara_copa.npy")    # binaria
resultado = compute_cdr_from_masks(disc_mask, cup_mask)
print("CDR:", resultado["cdr"], "Área disco:", resultado["disc_area"])
```
