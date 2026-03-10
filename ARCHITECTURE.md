# 🏗️ Hand Sign Trainer - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER (CLIENT-SIDE)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              NEXT.JS APPLICATION                     │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │         React Components (UI)              │   │  │
│  │  │  • CameraFeed                              │   │  │
│  │  │  • DataCollector                           │   │  │
│  │  │  • ModelTrainer                            │   │  │
│  │  │  • PracticeMode                            │   │  │
│  │  │  • Main App (Tabs)                         │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │           ↓ ↑                                       │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │    Machine Learning Libraries              │   │  │
│  │  │  • TensorFlow.js 4.11                      │   │  │
│  │  │  • Hand Pose Detection 2.0.1              │   │  │
│  │  │  • MediaPipe Hands 0.4                    │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │           ↓ ↑                                       │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │    Machine Learning Logic                  │   │  │
│  │  │  lib/hand-detection.ts                     │   │  │
│  │  │  lib/model-training.ts                     │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │           ↓ ↑                                       │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │    Storage Layer (Browser)                 │   │  │
│  │  │  • IndexedDB (Models & Data)               │   │  │
│  │  │  • localStorage (Metadata)                 │   │  │
│  │  │  • Memory (Runtime State)                  │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │           ↓ ↑                                       │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │    Hardware Access                         │   │  │
│  │  │  • Camera (MediaStream API)                │   │  │
│  │  │  • Canvas (Drawing)                        │   │  │
│  │  │  • WebGL (GPU Acceleration)                │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET (HTTPS)                         │
│  • CDN: TensorFlow.js libraries                            │
│  • CDN: MediaPipe resources                                │
│  • Vercel: Static assets                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### 1. Data Collection Pipeline

```
Camera Stream
    ↓
MediaPipe Hands Detection
    ↓
Extract 21 Keypoints (x, y, z, confidence)
    ↓
Keep x, y → 21 points × 2 = 42 values
    ↓
Normalize Keypoints
    - Translate to origin (wrist point)
    - Scale to [0, 1] range
    - Position/size invariant
    ↓
Store in Memory (CollectedSample[])
    ↓
Display Progress (30/30)
```

### 2. Training Pipeline

```
Collected Samples (grouped by label)
    ↓
Prepare Training Data
    - Create input tensor (N × 42)
    - Create output tensor (N × num_classes)
    - One-hot encode labels
    ↓
Initialize Model
    - Input: 42 dimensions
    - Dense(128) + ReLU + BatchNorm + Dropout
    - Dense(64) + ReLU + BatchNorm + Dropout
    - Dense(32) + ReLU
    - Dense(num_classes) + Softmax
    ↓
Compile Model
    - Optimizer: Adam (lr=0.001)
    - Loss: Categorical Crossentropy
    - Metrics: Accuracy
    ↓
Train for N Epochs
    - Shuffle data
    - Mini-batch processing
    - Validation split: 15%
    ↓
Save Model
    - Model weights to IndexedDB
    - Label mapping to localStorage
    ↓
Ready for Prediction
```

### 3. Recognition Pipeline

```
Live Camera Frame
    ↓
MediaPipe Hands Detection
    ↓
Extract Hand Keypoints
    ↓
Check: Hand Detected?
    ├─ NO → Clear Result Display
    │
    └─ YES → Continue
         ↓
    Normalize Keypoints (same as training)
         ↓
    Feed to Trained Model
         ↓
    Get Prediction Tensor
    Output: [prob_sign1, prob_sign2, ..., prob_signN]
         ↓
    Find Max Confidence
         ↓
    Confidence > Threshold?
    ├─ NO → Show "Processing..."
    │
    └─ YES → Display Sign + Confidence
```

---

## Component Architecture

```
app/page.tsx (Main Component)
  │
  ├─ State Management
  │  ├─ samples: TrainingSample[]
  │  ├─ activeTab: 'collect' | 'train' | 'practice'
  │  ├─ modelLoaded: boolean
  │  └─ isLoadingModel: boolean
  │
  ├─ Effects
  │  └─ Load model on mount (IndexedDB)
  │
  └─ Tabs
     │
     ├─ Tab 1: Data Collection
     │  └─ DataCollector Component
     │     ├─ CameraFeed (video + canvas)
     │     ├─ Hand detection loop
     │     ├─ Keypoint normalization
     │     └─ Sample storage
     │
     ├─ Tab 2: Model Training
     │  └─ ModelTrainer Component
     │     ├─ Dataset preview
     │     ├─ Training settings
     │     ├─ Training loop (epochs)
     │     ├─ Metrics display (live)
     │     └─ Model persistence
     │
     └─ Tab 3: Practice/Recognition
        └─ PracticeMode Component
           ├─ CameraFeed (real-time)
           ├─ Hand detection check ✨
           ├─ Keypoint normalization
           ├─ Model inference
           ├─ Confidence scoring
           └─ Result display (only if hand detected)
```

---

## Machine Learning Model Architecture

```
Input Layer (42 dimensions)
  ↓ [x1, y1, x2, y2, ..., x21, y21]
  │
Dense Layer (128 units, ReLU)
  ↓
BatchNormalization
  ↓
Dropout (30%)
  ↓
Dense Layer (64 units, ReLU)
  ↓
BatchNormalization
  ↓
Dropout (30%)
  ↓
Dense Layer (32 units, ReLU)
  ↓
Dense Layer (N classes, Softmax)
  ↓ [prob_class1, prob_class2, ..., prob_classN]
Output Layer
```

**Rationale:**
- 42 inputs: 21 hand keypoints × 2 coordinates
- 128 → 64 → 32: Progressive feature compression
- ReLU: Introduces non-linearity
- BatchNorm: Stabilizes training
- Dropout: Prevents overfitting
- Softmax: Probability distribution over classes

---

## State Management Flow

```
Global State (React Component)
  │
  ├─ Collected Samples
  │  ├─ Stored in: Memory (React state)
  │  ├─ Persisted in: Can add localStorage
  │  └─ Cleared by: User action (clear button)
  │
  ├─ Active Model
  │  ├─ Loaded from: IndexedDB (on mount)
  │  ├─ Trained with: trainModel() function
  │  ├─ Stored in: IndexedDB (after training)
  │  └─ Used for: Real-time predictions
  │
  ├─ Label Mapping
  │  ├─ Created during: Training
  │  ├─ Stored in: localStorage (JSON)
  │  ├─ Used for: Label → Probability mapping
  │  └─ Loaded with: Model restoration
  │
  └─ UI State
     ├─ activeTab: Persisted in component state
     ├─ isTraining: Temporary during training
     ├─ isCollecting: Temporary during collection
     └─ handDetected: Updated per frame
```

---

## Data Format Specifications

### Collected Sample Object
```typescript
interface TrainingSample {
  label: string              // e.g., "Hello", "A"
  keypoints: number[]        // 42 floats [0-1]
  timestamp: number          // ms since epoch
}
```

### Hand Keypoints Format
```
21 keypoints (from MediaPipe Hands):
  0: Wrist
  1-4: Thumb (CMC, MCP, IP, TIP)
  5-8: Index (MCP, PIP, DIP, TIP)
  9-12: Middle (MCP, PIP, DIP, TIP)
  13-16: Ring (MCP, PIP, DIP, TIP)
  17-20: Pinky (MCP, PIP, DIP, TIP)

Each keypoint has:
  - x: 0-1 (normalized)
  - y: 0-1 (normalized)
  - z: depth (ignored in this app)
  - confidence: 0-1 (reliability score)

Final format: [x1, y1, x2, y2, ..., x21, y21]
```

### Prediction Output
```typescript
interface PredictionResult {
  label: string                           // Most confident sign
  confidence: number                      // 0-1 confidence
  allPredictions: Array<{
    label: string
    confidence: number
  }>
}
```

---

## Storage Architecture

### IndexedDB (Browser Database)
```
Store: hand-sign-model
  └─ Model
     ├─ Weights (tensors)
     ├─ Architecture (JSON)
     └─ Metadata
     
Size: Typically 1-10MB
```

### localStorage (Key-Value Store)
```
Key: "hand-sign-model-labelmap"
Value: { "Hello": 0, "A": 1, ... }

Key: "hand-sign-model-numbertolabel"
Value: { "0": "Hello", "1": "A", ... }

Size: <1KB
```

### Memory (Runtime)
```
samples[]           // Current training samples
model               // Loaded TensorFlow model
labelMap            // String → Number mapping
numberToLabel       // Number → String mapping
```

---

## Error Handling Flow

```
Try Operation
  ↓
Catch Error
  ├─ Camera Error
  │  └─ Display: "Please allow camera access"
  │
  ├─ Model Training Error
  │  └─ Display: "Need at least 10 samples"
  │  └─ Validate: Minimum 2 classes required
  │
  ├─ Hand Detection Error
  │  └─ Log: Console error
  │  └─ Fallback: Show "Processing..."
  │
  └─ Storage Error
     └─ Warning: "Model save failed"
     └─ Fallback: Keep in memory
```

---

## Performance Optimization

```
1. Frame Processing
   ├─ Skip frames if processing in progress
   ├─ Throttle hand detection (every 100ms)
   └─ Async inference (non-blocking)

2. Model Loading
   ├─ Lazy load on demand
   ├─ Cache in IndexedDB
   └─ Preload on app init

3. Rendering
   ├─ Use requestAnimationFrame
   ├─ Canvas rendering (hardware accelerated)
   └─ Minimize DOM updates

4. Memory
   ├─ Dispose tensors after use
   ├─ Clear collected samples option
   └─ Monitor heap size
```

---

## Deployment Architecture

```
┌────────────────────────────────┐
│      GitHub Repository         │
│  (Source Code - User pushes)   │
└──────────────┬─────────────────┘
               │ git push
               ↓
┌────────────────────────────────┐
│   Vercel CI/CD Pipeline        │
│  (Auto-deploy on push)         │
│  1. Fetch code                 │
│  2. Run: pnpm install          │
│  3. Run: next build            │
│  4. Optimize build             │
│  5. Deploy to edge             │
└──────────────┬─────────────────┘
               ↓
┌────────────────────────────────┐
│   Vercel Global Network        │
│  (Distributed CDN)             │
│  ✓ HTTPS enabled               │
│  ✓ Cache optimization          │
│  ✓ Auto-scaling                │
│  ✓ Edge functions              │
└──────────────┬─────────────────┘
               ↓
┌────────────────────────────────┐
│   User Browser                 │
│  (Live app at deployed URL)    │
└────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Client-Side Processing
**Why:** No backend needed, complete privacy, works offline
**Trade-off:** More CPU load on device

### 2. IndexedDB for Models
**Why:** Persistent storage, supports large blobs (models)
**Trade-off:** Browser-dependent, limited quota (~50MB)

### 3. MediaPipe Hands
**Why:** Accurate, fast, 21-point tracking
**Trade-off:** Requires CDN for library

### 4. TensorFlow.js
**Why:** Full ML framework in browser, no server needed
**Trade-off:** Larger bundle, learning curve

### 5. React + Next.js
**Why:** Modern, scalable, great DX, Vercel support
**Trade-off:** Complexity for a single-page app

---

## Scalability Considerations

### Current Limits
- Signs: Unlimited (model scales automatically)
- Samples: Limited by IndexedDB (~50MB)
- Training time: ~2-5 min (with 30 samples, 2 signs)

### Future Enhancements
- Multi-hand support (increase from 1 to 2)
- Gesture dynamics (track hand movement)
- Custom model export/import
- Cloud model sharing
- Real-time collaboration

---

## Security Architecture

```
Layer 1: Browser Sandbox
  └─ JavaScript runs in isolated context

Layer 2: HTTPS/TLS
  └─ All communication encrypted

Layer 3: Camera Permission
  └─ User must explicitly grant access

Layer 4: Local Storage Only
  └─ No data transmitted to servers

Layer 5: Input Validation
  └─ Sign names sanitized
  └─ No code injection possible
```

---

## Monitoring & Debugging

### Development
- Browser DevTools (F12)
- Console logs for debugging
- Network tab for CDN resources
- Performance tab for profiling

### Production
- Vercel Analytics (optional)
- Vercel Error Tracking
- Browser console (user reports)
- Custom error logging (can add)

---

This architecture is designed to be:
✅ **Scalable** - Unlimited signs
✅ **Fast** - Real-time processing
✅ **Private** - Client-side only
✅ **Reliable** - Error handling
✅ **Maintainable** - Clear separation of concerns
