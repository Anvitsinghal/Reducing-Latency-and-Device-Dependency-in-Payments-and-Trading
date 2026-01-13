import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

def generate_palm_features(num_samples=10000, num_users=1000):
    print(f"🔄 Generating {num_samples} samples for {num_users} users...")
    
    data = []
    samples_per_user = num_samples // num_users
    
    for user_id in range(num_users):
        base_features = np.random.rand(37)
        
        for sample in range(samples_per_user):
            variation = np.random.normal(0, 0.05, 37)
            features = base_features + variation
            features = np.clip(features, 0, 1)
            
            timestamp = datetime.now() - timedelta(
                days=random.randint(0, 365),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            sample_data = {
                'user_id': user_id,
                'timestamp': timestamp.isoformat()
            }
            
            for i, feature in enumerate(features):
                sample_data[f'feature_{i}'] = feature
            
            data.append(sample_data)
        
        if (user_id + 1) % 100 == 0:
            print(f"  Generated data for {user_id + 1}/{num_users} users")
    
    df = pd.DataFrame(data)
    return df

def add_noise_samples(df, noise_ratio=0.05):
    num_noise = int(len(df) * noise_ratio)
    print(f"🔄 Adding {num_noise} noise samples...")
    
    noise_data = []
    for _ in range(num_noise):
        sample = {
            'user_id': -1,
            'timestamp': datetime.now().isoformat()
        }
        
        for i in range(37):
            sample[f'feature_{i}'] = np.random.rand()
        
        noise_data.append(sample)
    
    noise_df = pd.DataFrame(noise_data)
    combined_df = pd.concat([df, noise_df], ignore_index=True)
    return combined_df

def generate_dataset(output_path='data/palm_dataset.csv'):
    print("🚀 Palm Biometric Dataset Generation")
    print("=" * 50)
    
    df = generate_palm_features(num_samples=50000, num_users=1000)
    df = add_noise_samples(df, noise_ratio=0.05)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    df.to_csv(output_path, index=False)
    
    print(f"\n✅ Dataset saved to {output_path}")
    print(f"Total samples: {len(df)}")
    print(f"Features per sample: 37")
    print(f"Unique users: {df['user_id'].nunique()}")
    print("\n📊 Dataset Statistics:")
    print(df.describe())
    
    return df

if __name__ == '__main__':
    df = generate_dataset()
