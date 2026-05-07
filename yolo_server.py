import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import io
import base64
from PIL import Image
from pydantic import BaseModel

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageRequest(BaseModel):
    image: str # Base64 string

# Load YOLOv8 model
# Using the model from the other directory if available, otherwise it will download yolov8n.pt
model_path = r"C:\KULIAH\jagoAI-app\AutoCashier-\backend\yolov8n.pt"
try:
    model = YOLO(model_path)
except:
    model = YOLO("yolov8n.pt")

@app.post("/detect_base64")
async def detect_base64(req: ImageRequest):
    # Decode base64 image
    img_data = base64.b64decode(req.image.split(",")[-1])
    image = Image.open(io.BytesIO(img_data))
    
    # Convert PIL to OpenCV format
    img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Run inference
    results = model(img)
    
    detections = []
    for r in results:
        boxes = r.boxes
        for box in boxes:
            b = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
            c = box.cls.item()
            conf = box.conf.item()
            
            detections.append({
                "bbox": b,
                "label": model.names[int(c)],
                "confidence": conf
            })
            
    return {"detections": detections}

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Convert PIL to OpenCV format
    img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Run inference
    results = model(img)
    
    detections = []
    for r in results:
        boxes = r.boxes
        for box in boxes:
            b = box.xyxy[0].tolist()  # get box coordinates in (top, left, bottom, right) format
            c = box.cls.item()
            conf = box.conf.item()
            
            detections.append({
                "bbox": b,
                "label": model.names[int(c)],
                "confidence": conf
            })
            
    return {"detections": detections}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
