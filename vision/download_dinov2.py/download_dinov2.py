from transformers import AutoImageProcessor, AutoModel

# Ini akan otomatis mendownload model ke folder cache Hugging Face di PC kamu
processor = AutoImageProcessor.from_pretrained('facebook/dinov2-base')
model = AutoModel.from_pretrained('facebook/dinov2-base')

print("Model berhasil didownload dan dimuat!")