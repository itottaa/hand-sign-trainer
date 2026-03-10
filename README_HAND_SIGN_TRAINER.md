# 🤟 Hand Sign Trainer - React + TensorFlow.js

A modern, production-ready hand sign language learning platform built with **React**, **Next.js**, **TensorFlow.js**, and **MediaPipe Hands**.

## 🌟 Features

### ✨ Core Features
- **📷 Collect Data** - Use your webcam to collect hand gesture samples (30 per sign)
- **🧠 Train Model** - Train a TensorFlow.js neural network directly in your browser
- **🤟 Practice Mode** - Real-time hand sign recognition with live confidence scores
- **✅ Hand Detection Only** - Results only appear when a hand is detected by the model
- **💾 Local Storage** - All models and data stay in your browser using IndexedDB
- **📱 Mobile Responsive** - Works on desktop and mobile devices

### 🎯 Technical Highlights
- **Client-side Processing** - No server needed, no data leaves your device
- **Real-time Detection** - MediaPipe Hands for accurate 21-point hand tracking
- **Neural Network** - Trained model: Dense(128) → BN → Dropout → Dense(64) → BN → Dropout → Dense(32) → Softmax
- **Normalized Keypoints** - Position/scale/rotation invariant hand representation
- **Auto-save** - Models automatically saved to browser storage
- **Production Ready** - Optimized for Vercel deployment

---

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Deploy to Vercel (1 Click)

**Option 1: Use Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to deploy
```

**Option 2: GitHub Integration**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repo
5. Click "Deploy"

---

## 📖 How to Use

### Step 1️⃣ Collect Data (Collect Data Tab)

1. **Enter a Sign Name** - e.g., "Hello", "Thank You", "A", "1"
2. **Click "Start Collecting"** - Camera will start recording
3. **Hold Your Hand Steady** - Position your hand clearly in front of camera
4. **Wait for 30 Samples** - System automatically records keypoints
5. **Repeat for Different Signs** - Collect at least 2-3 different signs

**💡 Tips for Better Results:**
- Use consistent lighting
- Keep hand size relatively constant
- Show the full hand/fingers clearly
- Collect samples from different angles

### Step 2️⃣ Train Model (Train Model Tab)

1. **Click "🧠 Start Training"** - Training begins automatically
2. **Monitor Progress** - Watch live loss, accuracy, and validation metrics
3. **Wait for Completion** - ~2-5 minutes depending on sample count
4. **Model Auto-Saved** - Automatically saved to IndexedDB

**📊 What's Happening:**
- 80 epochs of training
- Real-time metric updates
- Automatic train/validation split (85/15)
- Model serialization to browser storage

### Step 3️⃣ Practice Recognition (Practice Tab)

1. **Click "▶ Start Practice"** - Real-time recognition begins
2. **Show Your Hand** - Make a sign in front of camera
3. **See Results** - Recognized sign appears only when hand is detected
4. **Confidence Score** - See probability of recognition

**⭐ Key Feature: Hand Detection**
- ✅ Sign appears only when hand is visible
- ✅ Disappears when hand leaves camera
- ✅ Smooth confidence updates
- ✅ Real-time skeleton visualization

---

## 🏗️ Architecture

### File Structure
```
app/
├── page.tsx              # Main app page with tabs
├── layout.tsx            # Root layout with metadata
└── globals.css           # Global styles

components/
├── camera-feed.tsx       # Reusable camera component
├── data-collector.tsx    # Data collection interface
├── model-trainer.tsx     # Training UI and logic
└── practice-mode.tsx     # Practice/recognition interface

lib/
├── hand-detection.ts     # MediaPipe Hands integration
└── model-training.ts     # TensorFlow.js training logic

public/
└── ...                   # Static assets
```

### Key Components

**Camera Feed** (`camera-feed.tsx`)
- Handles camera stream access
- HTTPS/localhost detection
- Frame capture for processing
- Skeleton drawing support

**Data Collector** (`data-collector.tsx`)
- Collects hand keypoints
- Manages sample storage
- Real-time hand detection status
- Sample grouping by label

**Model Trainer** (`model-trainer.tsx`)
- TensorFlow.js model creation
- Epoch-by-epoch training
- Live metrics display
- Model serialization

**Practice Mode** (`practice-mode.tsx`)
- Real-time prediction
- Hand detection check
- Confidence scoring
- Label display

### Machine Learning Pipeline

```
1. COLLECT
   └─ MediaPipe Hands (21 keypoints per hand)
   └─ Extract [x, y] coordinates (ignore z)
   └─ Normalize to [0,1] range

2. PREPARE
   └─ Group samples by label
   └─ One-hot encode labels
   └─ Create train/validation split

3. TRAIN
   └─ Dense(128) layer + BatchNorm + Dropout(0.3)
   └─ Dense(64) layer + BatchNorm + Dropout(0.3)
   └─ Dense(32) layer
   └─ Softmax output (# classes)
   └─ Adam optimizer, categorical crossentropy

4. SAVE
   └─ Model to IndexedDB
   └─ Label mapping to localStorage

5. PREDICT
   └─ Extract keypoints from video frame
   └─ Normalize to same scale
   └─ Pass through trained model
   └─ Get confidence scores
```

---

## 🔧 Configuration

### Browser Requirements
- **HTTPS Connection** (or localhost)
  - Camera access requires secure context
  - Localhost works for development
  - Vercel provides HTTPS automatically

- **Supported Browsers**
  - Chrome/Edge 85+
  - Firefox 79+
  - Safari 14+

### Storage
- **IndexedDB** - Model storage (typically 50MB+ quota)
- **LocalStorage** - Label mapping (tiny footprint)
- **Browser Cache** - TensorFlow.js libraries

### Hardware
- **Recommended** - Desktop/Laptop with webcam
- **Minimum** - Modern smartphone with front camera
- **GPU** - Automatically used if available (WebGL backend)

---

## 📦 Dependencies

Key packages:
- `@tensorflow/tfjs` - Machine learning framework
- `@tensorflow-models/hand-pose-detection` - Hand detection
- `@mediapipe/hands` - Hand keypoint extraction
- `next` - React framework
- `tailwindcss` - Styling

See `package.json` for full dependency list.

---

## 🌐 Deployment to Vercel

### Prerequisites
1. GitHub account with code pushed
2. Vercel account (free tier works)

### Steps

**1. Create GitHub Repo**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hand-sign-trainer.git
git push -u origin main
```

**2. Deploy to Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Select "Next.js" template
- Connect your GitHub repo
- Click "Deploy"

**3. Configure (if needed)**
- Framework: Next.js (auto-detected)
- Build Command: `pnpm install && next build`
- Output Directory: `.next`
- No environment variables needed

**4. Access Your App**
```
https://YOUR_PROJECT_NAME.vercel.app
```

### Vercel Configuration
The `vercel.json` file includes:
- Build commands for pnpm
- Proper headers for camera access
- CORS and security policies
- Framework detection

---

## 🎨 Customization

### Add More Signs
Just collect data for additional signs - no code changes needed!

### Change Training Parameters
Edit `components/model-trainer.tsx`:
```typescript
const epochs = 80;      // Increase for more training
const batchSize = 16;   // Adjust based on sample count
const validationSplit = 0.15;  // Train/test split
```

### Adjust Architecture
Modify `lib/model-training.ts` `createModel()` function:
```typescript
x = tf.layers.dense({
  units: 128,           // Change layer size
  activation: 'relu',
}).apply(x) as tf.SymbolicTensor;
```

### Style Changes
- Tailwind CSS classes in components
- Modify colors in `app/globals.css`
- Theme variables in `tailwind.config.ts`

---

## 🐛 Troubleshooting

### Camera Not Working
- ✅ Check HTTPS (or localhost)
- ✅ Allow camera permission in browser
- ✅ Try different browser
- ✅ Check camera hardware

### Model Training Fails
- ✅ Collect at least 10 samples
- ✅ Need at least 2 different signs
- ✅ Check browser console for errors
- ✅ Try with fewer samples first

### Recognition Not Accurate
- ✅ Collect more samples (30+ per sign)
- ✅ Use consistent hand position/size
- ✅ Ensure good lighting
- ✅ Train for more epochs

### Storage Issues
- ✅ Clear browser cache/cookies
- ✅ Check IndexedDB quota
- ✅ Use incognito mode to test

---

## 🔐 Privacy & Security

✅ **Your Data is Safe**
- All processing happens in your browser
- No data sent to any server
- No tracking or analytics
- Models stored locally only
- CORS enabled for media access only

---

## 📚 Learning Resources

- [TensorFlow.js Docs](https://www.tensorflow.org/js)
- [MediaPipe Hands](https://mediapipe.dev/solutions/hands)
- [Next.js Documentation](https://nextjs.org/docs)
- [Hand Pose Detection API](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)

---

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- Multi-hand support
- Hand gesture recognition with motion
- Model export/sharing
- Recognition confidence thresholds
- Performance optimization

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🎉 Get Started Now!

1. **Clone or use this code**
2. **Run locally**: `pnpm install && pnpm dev`
3. **Deploy to Vercel**: Push to GitHub and deploy
4. **Start collecting data** and training models!

---

**Happy sign learning! 🤟**
