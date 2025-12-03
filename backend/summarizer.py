import sys
import os

# Add the local libs directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
libs_path = os.path.join(parent_dir, "libs")
sys.path.insert(0, libs_path)

from transformers import PegasusForConditionalGeneration, PegasusTokenizer
import os

# Suppress TensorFlow warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Initialize model and tokenizer as global variables
tokenizer = None
model = None

def initialize_model():
    global tokenizer, model
    if tokenizer is None or model is None:
        model_name = "google/pegasus-xsum"
        tokenizer = PegasusTokenizer.from_pretrained(model_name)
        model = PegasusForConditionalGeneration.from_pretrained(model_name)

def summarize_email(subject, sender, snippet, body):
    initialize_model()  # Ensure model is initialized
    
    # Add a prompt to encourage more conversational tone
    full_text = f"Please summarize this email in a casual, friendly way:\nSubject: {subject}\nFrom: {sender}\nSnippet: {snippet}\n\n{body}"
    
    # Tokenize and generate summary
    tokens = tokenizer(full_text, truncation=True, padding="longest", return_tensors="pt", max_length=512)
    summary_ids = model.generate(
        tokens["input_ids"],
        max_length=250,
        min_length=60,
        length_penalty=1.5,
        num_beams=4,
        repetition_penalty=1.2,
        temperature=0.7,
        early_stopping=True
    )
    
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

def format_summary(summary, sender=None, subject=None):
    if sender and subject:
        formatted = f"📧 From: {sender}\n📎 Subject: {subject}\n\n📝 Summary:\n{summary}"
    else:
        formatted = summary
    return formatted