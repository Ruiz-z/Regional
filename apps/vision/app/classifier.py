from .detector import Detection


class TeachableMachineClassifier:
    """Adapta un clasificador binario de imagen completa (Teachable Machine,
    exportado a TFLite) a la misma interfaz que `YoloDetectionModel`
    (DetectionModel.predict). A diferencia de YOLO, este modelo no ubica
    cajas ni cuenta instancias — solo dice "Malas"/"Buenas" para todo el
    frame. Por eso emite como máximo una única Detection centrada en el
    frame (confianza = la del modelo), que PestPipeline/zone_mapping
    resuelve igual que cualquier otra detección real.

    Import perezoso de tensorflow: mismo criterio que YoloDetectionModel con
    ultralytics, para no requerir tensorflow instalado en los tests del
    resto del pipeline."""

    def __init__(
        self,
        model_path: str,
        labels_path: str,
        confidence_threshold: float = 0.5,
    ):
        import tensorflow as tf

        self._interpreter = tf.lite.Interpreter(model_path=model_path)
        self._interpreter.allocate_tensors()
        self._input_detail = self._interpreter.get_input_details()[0]
        self._output_detail = self._interpreter.get_output_details()[0]
        with open(labels_path) as f:
            self._labels = [line.split(" ", 1)[1].strip() for line in f]
        self._confidence_threshold = confidence_threshold

    def predict(self, frame) -> list[Detection]:
        import cv2

        resized = cv2.resize(frame, (224, 224))
        # Mismo preprocesado que exporta Teachable Machine: normaliza a [-1, 1].
        normalized = (resized.astype("float32") / 127.5) - 1
        batch = normalized.reshape(1, 224, 224, 3).astype(
            self._input_detail["dtype"]
        )

        self._interpreter.set_tensor(self._input_detail["index"], batch)
        self._interpreter.invoke()
        prediction = self._interpreter.get_tensor(self._output_detail["index"])[0]

        label_idx = int(prediction.argmax())
        confidence = float(prediction[label_idx])
        if (
            self._labels[label_idx] != "Malas"
            or confidence < self._confidence_threshold
        ):
            return []

        height, width = frame.shape[:2]
        return [
            Detection(x_center=width / 2, y_center=height / 2, confidence=confidence)
        ]
