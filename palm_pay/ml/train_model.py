import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import mediapipe as mp
import cv2
import pickle
import json
from datetime import datetime

CONFIG = {
    'model_version': '2.1.0',
    'input_features': 37,
    'hidden_layers': [128, 64, 32],
    'output_classes': 1000,
    'learning_rate': 0.001,
    'batch_size': 32,
    'epochs': 100,
    'validation_split': 0.2
}

class PalmBiometricModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
    def extract_features(self, landmarks):
        features = []
        
        palm_width = self._distance(landmarks[0], landmarks[5])
        palm_height = self._distance(landmarks[0], landmarks[9])
        features.extend([palm_width, palm_height])
        
        finger_bases = [1, 5, 9, 13, 17]
        finger_tips = [4, 8, 12, 16, 20]
        for base, tip in zip(finger_bases, finger_tips):
            features.append(self._distance(landmarks[base], landmarks[tip]))
        
        for i in range(5):
            base = 1 if i == 0 else (i * 4 + 1)
            mid = 2 if i == 0 else (i * 4 + 2)
            tip = 4 if i == 0 else (i * 4 + 4)
            ratio = self._distance(landmarks[base], landmarks[mid]) / \
                    self._distance(landmarks[mid], landmarks[tip])
            features.append(ratio)
        
        for i in range(len(finger_tips)):
            for j in range(i + 1, len(finger_tips)):
                features.append(self._distance(landmarks[finger_tips[i]], 
                                              landmarks[finger_tips[j]]))
        
        for base in finger_bases:
            angle = np.arctan2(landmarks[base][1] - landmarks[0][1],
                             landmarks[base][0] - landmarks[0][0])
            features.append(angle)
        
        for tip in finger_tips:
            features.append(self._distance(landmarks[0], landmarks[tip]))
        
        return np.array(features)
    
    def _distance(self, p1, p2):
        return np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
    
    def build_model(self):
        model = keras.Sequential([
            keras.layers.Input(shape=(CONFIG['input_features'],)),
            keras.layers.Dense(128, activation='relu', 
                             kernel_regularizer=keras.regularizers.l2(0.01)),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.3),
            
            keras.layers.Dense(64, activation='relu',
                             kernel_regularizer=keras.regularizers.l2(0.01)),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.3),
            
            keras.layers.Dense(32, activation='relu'),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.2),
            
            keras.layers.Dense(CONFIG['output_classes'], activation='softmax')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=CONFIG['learning_rate']),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy', 'top_k_categorical_accuracy']
        )
        
        self.model = model
        return model
    
    def train(self, X_train, y_train, X_val, y_val):
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-6
            ),
            keras.callbacks.ModelCheckpoint(
                'models/palm_biometric_best.h5',
                monitor='val_accuracy',
                save_best_only=True
            )
        ]
        
        history = self.model.fit(
            X_train_scaled, y_train,
            validation_data=(X_val_scaled, y_val),
            epochs=CONFIG['epochs'],
            batch_size=CONFIG['batch_size'],
            callbacks=callbacks,
            verbose=1
        )
        
        return history
    
    def evaluate(self, X_test, y_test):
        X_test_scaled = self.scaler.transform(X_test)
        results = self.model.evaluate(X_test_scaled, y_test)
        
        metrics = {
            'loss': results[0],
            'accuracy': results[1],
            'top_k_accuracy': results[2]
        }
        
        return metrics
    
    def save_model(self, path='models/'):
        self.model.save(f'{path}palm_biometric_model.h5')
        with open(f'{path}scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        
        with open(f'{path}config.json', 'w') as f:
            json.dump(CONFIG, f, indent=2)
        
        print(f"✅ Model saved to {path}")
    
    def load_model(self, path='models/'):
        self.model = keras.models.load_model(f'{path}palm_biometric_model.h5')
        with open(f'{path}scaler.pkl', 'rb') as f:
            self.scaler = pickle.load(f)
        
        print(f"✅ Model loaded from {path}")

def load_dataset(dataset_path='data/palm_dataset.csv'):
    df = pd.read_csv(dataset_path)
    X = df.drop(['user_id', 'timestamp'], axis=1).values
    y = df['user_id'].values
    return X, y

def main():
    print("🚀 PalmPay Biometric Model Training")
    print("=" * 50)
    
    print("📊 Loading dataset...")
    X, y = load_dataset()
    print(f"Dataset size: {X.shape[0]} samples, {X.shape[1]} features")
    
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )
    
    print(f"Training set: {X_train.shape[0]} samples")
    print(f"Validation set: {X_val.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    
    print("\n🏗️  Building model...")
    palm_model = PalmBiometricModel()
    palm_model.build_model()
    palm_model.model.summary()
    
    print("\n🎯 Training model...")
    history = palm_model.train(X_train, y_train, X_val, y_val)
    
    print("\n📈 Evaluating model...")
    metrics = palm_model.evaluate(X_test, y_test)
    print(f"Test Accuracy: {metrics['accuracy']:.4f}")
    print(f"Test Top-K Accuracy: {metrics['top_k_accuracy']:.4f}")
    
    print("\n💾 Saving model...")
    palm_model.save_model()
    
    print("\n✅ Training complete!")
    print(f"Model version: {CONFIG['model_version']}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == '__main__':
    main()
