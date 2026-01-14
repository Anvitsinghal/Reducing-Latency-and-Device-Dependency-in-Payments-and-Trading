# 📁 PlamPay - Project Structure

> **Complete directory structure for the PlamPay gesture-powered biometric payment system**  
> Built by Team Charlizard for GitHub Hackathon 2026

---

## 🌳 Directory Tree

```
PlamPay/
│
├── 📂 Backend/                          # Flask API Server (Python)
│   ├── app.py                          # Main Flask application entry point
│   ├── config.py                       # Environment configuration & constants
│   │
│   ├── 📂 routes/                      # API Route Handlers
│   │   ├── auth_routes.py             # User authentication endpoints
│   │   ├── gesture_routes.py          # Gesture processing endpoints
│   │   └── transaction_routes.py      # Payment & trading endpoints
│   │
│   ├── 📂 services/                    # Business Logic Layer
│   │   ├── palm_auth_service.py       # Palm biometric authentication
│   │   ├── gesture_service.py         # Gesture recognition & processing
│   │   ├── transaction_service.py     # Payment & trading logic
│   │   └── smoothing_service.py       # Tremor stabilization algorithms
│   │
│   ├── 📂 models/                      # Data Models
│   │   ├── user.py                    # User model with palm signatures
│   │   └── transaction.py             # Transaction model with gestures
│   │
│   └── 📂 utils/                       # Utility Functions
│       ├── logger.py                  # Custom logging system
│       └── latency_monitor.py         # Performance tracking & metrics
│
├── 📂 frontend/                         # React Frontend Application
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # NPM dependencies
│   ├── vite.config.js                  # Vite build configuration
│   │
│   └── 📂 src/                         # Source Code
│       ├── main.jsx                   # React application entry
│       ├── App.jsx                    # Main app component
│       │
│       ├── 📂 components/              # React Components
│       │   ├── GestureOverlay.jsx     # Interactive gesture canvas
│       │   ├── ConfirmationModal.jsx  # Transaction confirmation modal
│       │   └── TransactionStatus.jsx  # Transaction dashboard
│       │
│       ├── 📂 services/                # Frontend Services
│       │   └── api.js                 # API service layer
│       │
│       └── 📂 styles/                  # Stylesheets
│           └── main.css               # Global CSS with dark theme
│
├── 📂 vision/                           # Computer Vision Pipeline (Optional)
│   ├── hand_tracking.py                # MediaPipe hand tracking
│   ├── palm_roi.py                     # Palm region extraction
│   ├── feature_extraction.py           # Feature computation
│   └── gesture_classifier.py           # Advanced gesture classification
│
├── 📄 README.md                         # Project documentation
├── 📄 PROJECT_STRUCTURE.md              # This file
├── 📄 LICENSE                           # MIT License
├── 📄 .gitignore                        # Git ignore rules
└── 📄 requirements.txt                  # Python dependencies (to be created)
```

---

## 📦 Component Details

### 🔧 Backend Components

#### **app.py**
- Flask application initialization
- Route registration (auth, gesture, transaction)
- CORS configuration
- Error handlers (404, 500)
- Health check endpoint
- API stats endpoint

#### **config.py**
- Environment variables
- Configuration classes (Development, Production)
- API constants (thresholds, timeouts)
- CORS origins
- Database URI

#### **Routes Layer**

**auth_routes.py**
- `POST /api/auth/register` - User registration
- `POST /api/auth/enroll-palm` - Palm enrollment
- `POST /api/auth/verify-palm` - Palm verification
- `GET /api/auth/user/:id` - Get user details
- `GET /api/auth/enrolled-users` - List enrolled users

**gesture_routes.py**
- `POST /api/gesture/process` - Process gesture data
- `GET /api/gesture/history` - Get gesture history
- `GET /api/gesture/types` - List gesture types
- `POST /api/gesture/validate` - Validate gesture

**transaction_routes.py**
- `POST /api/transaction/payment` - Create payment
- `POST /api/transaction/trade` - Create trade
- `GET /api/transaction/:id` - Get transaction
- `GET /api/transaction/user/:id` - User transactions
- `POST /api/transaction/:id/cancel` - Cancel transaction
- `GET /api/transaction/stats` - Transaction statistics

#### **Services Layer**

**palm_auth_service.py**
- Palm signature generation (SHA-256 hash)
- Feature extraction (lines, width, height, landmarks)
- Similarity calculation (cosine similarity)
- Enrollment with 3-scan verification
- Verification with threshold (0.85)
- Latency monitoring integration

**gesture_service.py**
- Gesture classification (swipe, circle, pinch, tap)
- Confidence scoring (75% threshold)
- Smoothing integration
- Gesture history tracking
- Multi-point trajectory analysis
- Action mapping (payment, trade, cancel)

**transaction_service.py**
- Payment processing (mock providers)
- Trade execution (mock platforms)
- Transaction limits enforcement
- Status management (pending, completed, failed)
- Gesture trigger tracking
- Latency recording

**smoothing_service.py**
- Moving average smoothing
- Kalman filter implementation
- Exponential smoothing
- Tremor removal algorithm
- Adaptive smoothing (velocity-based)
- Multi-scale trajectory processing

#### **Models Layer**

**user.py**
- User data model (id, username, email)
- Palm signature storage
- Verification status tracking
- Repository pattern implementation
- CRUD operations

**transaction.py**
- Transaction model (payment/trade)
- Status tracking (pending/completed/failed)
- Gesture trigger recording
- Latency metrics
- Metadata storage
- Repository pattern

#### **Utils Layer**

**logger.py**
- Custom logger class
- Console and file handlers
- Formatted output
- Log levels (DEBUG, INFO, WARNING, ERROR)

**latency_monitor.py**
- Performance tracking
- Operation-specific metrics
- Decorator for automatic monitoring
- Statistics calculation (avg, min, max)
- Deque-based storage (100 samples)

---

### 🎨 Frontend Components

#### **App.jsx**
- Main application state management
- User authentication flow
- Palm enrollment process
- Gesture detection handling
- Transaction management
- Camera initialization
- Modal control

#### **Components**

**GestureOverlay.jsx**
- Canvas-based gesture drawing
- Touch and mouse event handling
- Real-time gesture trail visualization
- Gesture processing API calls
- Confidence display
- Smooth animations

**ConfirmationModal.jsx**
- Transaction confirmation UI
- Dynamic content (payment/trade)
- Security indicators
- Animated modal with backdrop blur
- Confirm/Cancel actions

**TransactionStatus.jsx**
- Real-time transaction dashboard
- Statistics summary (total, completed, pending, failed)
- Filter tabs (all, completed, pending, failed)
- Transaction list with status badges
- Latency indicators
- Empty state handling

#### **Services**

**api.js**
- Centralized API service
- Authentication endpoints
- Gesture processing
- Transaction creation
- Error handling
- Base URL configuration

#### **Styles**

**main.css**
- CSS variables for theming
- Dark theme with gradients
- Glassmorphism effects
- Neon glow animations
- Responsive grid layouts
- Hover effects and transitions
- Modal animations (fadeIn, slideUp)
- Mobile-first responsive design

---

### 👁️ Vision Components (Optional)

#### **hand_tracking.py**
- MediaPipe Hands integration
- 21 landmark detection
- Multi-hand support (up to 2)
- Landmark extraction (x, y, z coordinates)
- Hand center calculation
- Finger tip detection
- Palm size measurement
- Palm open/closed detection

#### **palm_roi.py**
- Palm region of interest extraction
- Bounding box calculation
- ROI normalization (128x128)
- Preprocessing (grayscale, equalization, denoising)
- Palm mask generation
- Orientation detection
- Rotation to upright position
- Multi-scale extraction

#### **feature_extraction.py**
- Geometric features (finger lengths, palm dimensions, angles)
- Texture features (LBP, Gabor filters)
- Keypoint features (SIFT, ORB descriptors)
- Palm line detection (Canny + Hough transform)
- Statistical features (mean, std, variance)
- Feature vector creation

#### **gesture_classifier.py**
- Swipe detection (left, right, up, down)
- Circle detection (circularity scoring)
- Pinch/Spread detection (distance-based)
- Static gestures (palm open, fist, tap)
- Compound gestures (multi-step sequences)
- Confidence scoring
- Gesture history tracking
- Linearity calculation

---

## 🔄 Data Flow

### Authentication Flow
```
User → Frontend → Camera → MediaPipe → Palm Features
                                            ↓
                                    Backend API
                                            ↓
                              Palm Auth Service
                                            ↓
                                    User Model
                                            ↓
                                    Response
```

### Transaction Flow
```
User Gesture → Canvas → Gesture Overlay → API Call
                                              ↓
                                      Gesture Service
                                              ↓
                                    Smoothing Service
                                              ↓
                                   Transaction Service
                                              ↓
                                   Transaction Model
                                              ↓
                                        Response
```

---

## 🚀 Technology Stack Summary

### Backend
- **Runtime**: Python 3.10+
- **Framework**: Flask 3.0
- **Libraries**: NumPy, SciPy, Flask-CORS

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **Styling**: Vanilla CSS with CSS Variables

### Computer Vision
- **Hand Tracking**: MediaPipe 0.10
- **Image Processing**: OpenCV (cv2)
- **Feature Extraction**: SIFT, ORB, LBP, Gabor

### Machine Learning
- **Algorithms**: Kalman Filter, Cosine Similarity
- **Libraries**: Scikit-learn, NumPy

---

## 📊 File Statistics

| Category | Files | Lines of Code (est.) |
|----------|-------|---------------------|
| Backend | 13 | ~2,500 |
| Frontend | 9 | ~1,800 |
| Vision | 4 | ~1,200 |
| Documentation | 3 | ~800 |
| **Total** | **29** | **~6,300** |

---

## 🎯 Key Features by Component

### Backend
✅ RESTful API with 15+ endpoints  
✅ Palm biometric authentication  
✅ Gesture recognition with 6+ gesture types  
✅ Transaction processing (payments & trades)  
✅ Latency monitoring on all operations  
✅ In-memory data storage with repository pattern  

### Frontend
✅ Modern React SPA with Vite  
✅ Real-time gesture canvas with trail visualization  
✅ Beautiful dark theme with neon accents  
✅ Transaction dashboard with live stats  
✅ Responsive design for all devices  
✅ Smooth animations and transitions  

### Vision
✅ MediaPipe hand tracking integration  
✅ Palm ROI extraction and preprocessing  
✅ Comprehensive feature extraction  
✅ Advanced gesture classification  
✅ Tremor stabilization algorithms  
✅ Multi-scale processing  

---

## 📝 Notes

- All backend code is written without comments as per requirements
- Frontend uses modern ES6+ JavaScript with React hooks
- Vision pipeline is optional and can be integrated separately
- Project follows clean architecture principles
- Repository pattern used for data access
- Service layer handles all business logic
- Latency monitoring built into all critical operations

---

**Built with 🔥 by Team Charlizard**  
*GitHub Hackathon 2026*
