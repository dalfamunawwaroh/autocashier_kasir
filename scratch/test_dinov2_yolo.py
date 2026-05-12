import cv2
import numpy as np
import torch
from ultralytics import YOLOWorld
from transformers import AutoImageProcessor, AutoModel
from PIL import Image

def test():
    print("Loading YOLO-World...")
    yolo_model = YOLOWorld("yolov8s-world.pt")
    yolo_model.set_classes(["product", "bottle", "box", "can", "snack"])
    print("YOLO-World loaded.")

    print("Loading DINOv2...")
    processor = AutoImageProcessor.from_pretrained('facebook/dinov2-base')
    dino_model = AutoModel.from_pretrained('facebook/dinov2-base')
    print("DINOv2 loaded.")
    
    # Create a dummy image
    dummy_img = np.zeros((480, 640, 3), dtype=np.uint8)
    results = yolo_model(dummy_img)
    print("YOLO results:", results)
    
    dummy_pil = Image.fromarray(dummy_img)
    inputs = processor(images=dummy_pil, return_tensors="pt")
    with torch.no_grad():
        outputs = dino_model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)
    print("DINO embeddings shape:", embeddings.shape)

if __name__ == "__main__":
    test()
