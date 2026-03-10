# ⚡ Quick Start - Hand Sign Trainer

Get your Hand Sign Trainer running in 5 minutes!

---

## 🎯 Option 1: Deploy Immediately (No Code Changes)

### 1️⃣ Push to GitHub
```bash
git init
git add .
git commit -m "Hand Sign Trainer"
git remote add origin https://github.com/YOUR_USERNAME/hand-sign-trainer.git
git branch -M main
git push -u origin main
```

### 2️⃣ Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repo
3. Click **Deploy**
4. Done! 🎉 Your app is live in 2-5 minutes

---

## 💻 Option 2: Run Locally First

### Setup
```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Features to Test
- 📷 **Collect Data** - Record 30 hand samples
- 🧠 **Train** - Neural network training (2-5 min)
- 🤟 **Practice** - Real-time recognition

---

## 📱 Using the App

### Collect Data (Tab 1)
1. Type a sign name: "Hello"
2. Click "Start Collecting"
3. Hold your hand steady
4. System records 30 samples automatically
5. Repeat for 2-3 different signs

### Train Model (Tab 2)
1. Click "🧠 Start Training"
2. Watch metrics update
3. Wait for completion (~2-5 min)

### Practice Mode (Tab 3)
1. Click "▶ Start Practice"
2. Show your hand to camera
3. **Sign appears ONLY when hand is detected** ✅
4. See confidence score

---

## ⭐ Key Features

✅ **Hand Detection Only** - Results appear only with visible hand  
✅ **Browser-Based** - No server, all data local  
✅ **Real-Time** - Instant recognition  
✅ **Free** - No costs to deploy or use  
✅ **Mobile Ready** - Works on phones & tablets  

---

## 🚀 Deploy in 3 Clicks

1. Push code to GitHub
2. Go to vercel.com/new
3. Select repo → Deploy

**That's it!** Your app is live with HTTPS.

---

## 📸 What's Needed

- ✅ Webcam (built-in or external)
- ✅ Laptop/Phone with browser
- ✅ Good lighting
- ✅ Internet connection

---

## 🎨 Customization

**Change colors** → Edit `app/globals.css`  
**Adjust training** → Edit `components/model-trainer.tsx`  
**Modify architecture** → Edit `lib/model-training.ts`  

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera blocked | Allow permission in browser |
| Build fails | Run `pnpm install` locally first |
| HTTPS required | Use Vercel (provides HTTPS) or localhost |
| Poor accuracy | Collect more samples (30+) |

---

## 📚 Learn More

- Full docs: [README_HAND_SIGN_TRAINER.md](./README_HAND_SIGN_TRAINER.md)
- Deploy guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Code: See `components/` and `lib/` folders

---

## 🎉 Next Steps

1. ✅ Deploy to Vercel (or run locally)
2. ✅ Test collecting data
3. ✅ Train a model
4. ✅ Practice recognition
5. ✅ Share with others!

---

**Ready?** Let's go! 🤟

[👉 Deploy Now](https://vercel.com/new) | [📖 Full Docs](./README_HAND_SIGN_TRAINER.md)
