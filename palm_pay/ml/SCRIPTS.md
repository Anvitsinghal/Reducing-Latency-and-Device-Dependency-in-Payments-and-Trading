# ML Pipeline Scripts

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate dataset
python generate_dataset.py

# 3. Train model
python train_model.py

# 4. Evaluate model
python evaluate.py

# 5. Run inference
python inference.py
```

## Scripts Overview

- **generate_dataset.py** - Creates synthetic palm biometric dataset
- **train_model.py** - Trains deep learning model
- **inference.py** - Real-time authentication
- **evaluate.py** - Model performance analysis

## Model Files

- `models/palm_biometric_model.h5` - Trained Keras model
- `models/scaler.pkl` - Feature scaler
- `models/config.json` - Model configuration

## Data Files

- `data/palm_dataset.csv` - Training dataset (50K samples)
- `data/test_samples.csv` - Test samples

## Reports

- `reports/training_history.png` - Training curves
- `reports/confusion_matrix.png` - Confusion matrix
- `reports/feature_importance.png` - Feature analysis
- `reports/performance_report.md` - Full metrics
