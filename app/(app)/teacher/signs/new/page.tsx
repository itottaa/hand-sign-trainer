'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, SignCategory } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { CameraFeed } from '@/components/camera-feed';
import {
  initializeHandDetector,
  detectHands,
  drawHands,
  normalizeKeypoints,
  hasHandDetected,
  getHandCount,
  DetectedHand,
} from '@/lib/hand-detection';
import { trainModel, saveModel, TrainingSample } from '@/lib/model-training';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'details' | 'capture' | 'train' | 'done';

export default function CreateSignPage() {
  const { user, isTeacher } = useAuth();
  const router = useRouter();

  // Form state
  const [signName, setSignName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [categories, setCategories] = useState<SignCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Flow state
  const [step, setStep] = useState<Step>('details');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Camera / detection state
  const [detectorReady, setDetectorReady] = useState(false);
  const [hands, setHands] = useState<DetectedHand[]>([]);
  const [handCount, setHandCount] = useState(0);
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const captureRef = useRef(false);
  const handsRef = useRef<DetectedHand[]>([]);

  // Training state
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainAcc, setTrainAcc] = useState(0);
  const [isTrained, setIsTrained] = useState(false);
  const [savedSignId, setSavedSignId] = useState<string | null>(null);

  useEffect(() => {
    if (isTeacher) fetchCategories();
  }, [isTeacher]);

  useEffect(() => {
    if (step === 'capture') {
      initializeHandDetector().then(ok => setDetectorReady(ok));
    }
  }, [step]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('sign_categories').select('*').eq('teacher_id', user?.id);
    setCategories(data || []);
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    const { data, error } = await supabase
      .from('sign_categories')
      .insert({ name: newCategory, teacher_id: user?.id })
      .select();
    if (!error && data?.[0]) {
      setCategories(prev => [...prev, data[0]]);
      setSelectedCategory(data[0].id);
      setNewCategory('');
      setIsCreatingCategory(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedCategory) { setError('Please select or create a category'); return; }
    if (!signName.trim()) { setError('Sign name is required'); return; }

    // Save sign to DB first
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hand_signs')
        .insert({ name: signName, category_id: selectedCategory, teacher_id: user?.id, difficulty, description: description || null })
        .select()
        .single();
      if (error) throw error;
      setSavedSignId(data.id);
      setStep('capture');
    } catch (err: any) {
      setError(err.message || 'Failed to save sign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrameCapture = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!detectorReady) return;
    const detected = await detectHands(canvas);
    handsRef.current = detected;
    setHands(detected);
    setHandCount(detected.length);

    if (captureRef.current && detected.length > 0) {
      const kp = normalizeKeypoints(detected[0].landmarks);
      if (kp.length === 42) {
        setSamples(prev => [...prev, { keypoints: kp, label: signName, timestamp: Date.now() }]);
      }
    }
  }, [detectorReady, signName]);

  const handleDraw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    drawHands(ctx, handsRef.current, w, h);
    if (captureRef.current) {
      ctx.fillStyle = 'rgba(255,0,0,0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(3, 3, w - 6, h - 6);
    }
  }, []);

  const startCapture = async () => {
    if (!hasHandDetected(handsRef.current)) return;
    setIsCapturing(true);
    captureRef.current = true;
    // capture for 3 seconds
    for (let i = 3; i > 0; i--) {
      setCaptureCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    captureRef.current = false;
    setIsCapturing(false);
    setCaptureCountdown(0);
  };

  const clearSamples = () => setSamples([]);

  const handleTrain = async () => {
    if (samples.length < 10) { setError('Need at least 10 samples. Keep capturing!'); return; }
    setStep('train');
    setError('');
    try {
      await trainModel(
        { samples, labels: [signName] },
        50,
        16,
        0.15,
        (epoch, logs) => {
          setTrainProgress(Math.round((epoch / 50) * 100));
          setTrainAcc(Math.round((logs?.acc || 0) * 100));
        }
      );
      await saveModel(`sign-${savedSignId}`);
      setIsTrained(true);
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Training failed');
      setStep('capture');
    }
  };

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-600 mb-4">Only teachers can access this page.</p>
          <Link href="/dashboard"><Button>Go to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/teacher/dashboard" className="text-blue-600 hover:underline text-sm block mb-1">← Back</Link>
            <h1 className="text-xl font-bold text-slate-900">Create New Sign</h1>
          </div>
          <div className="flex gap-2">
            {(['details','capture','train','done'] as Step[]).map((s, i) => (
              <div key={s} className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${step === s ? 'bg-blue-600 text-white' : i < (['details','capture','train','done'] as Step[]).indexOf(step) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && <Alert className="mb-6 bg-red-50 border-red-200 text-red-700">{error}</Alert>}

        {/* STEP 1: Details */}
        {step === 'details' && (
          <Card className="p-8">
            <h2 className="text-lg font-semibold mb-6 text-slate-800">Sign Details</h2>
            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sign Name *</label>
                <Input value={signName} onChange={e => setSignName(e.target.value)} placeholder="e.g., Hello, Thank You, Yes" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                {isCreatingCategory ? (
                  <div className="flex gap-2">
                    <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name" className="flex-1" />
                    <Button type="button" onClick={handleCreateCategory} className="bg-green-600 hover:bg-green-700">Create</Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreatingCategory(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Select a category --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Button type="button" variant="outline" onClick={() => setIsCreatingCategory(true)} className="w-full">+ New Category</Button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="How to perform this sign..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {isLoading ? 'Saving...' : 'Continue to Camera Capture →'}
              </Button>
            </form>
          </Card>
        )}

        {/* STEP 2: Capture */}
        {step === 'capture' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-800">📷 Capture: <span className="text-blue-600">"{signName}"</span></h2>
                  <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full ${handCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    ✋ {handCount} hand{handCount !== 1 ? 's' : ''} detected
                  </div>
                </div>

                {!detectorReady ? (
                  <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Loading hand detector...</p>
                    </div>
                  </div>
                ) : (
                  <CameraFeed onFrameCapture={handleFrameCapture} drawCallback={handleDraw} label="Capturing" />
                )}

                {captureCountdown > 0 && (
                  <div className="mt-3 text-center">
                    <span className="text-4xl font-bold text-red-500 animate-pulse">{captureCountdown}</span>
                    <p className="text-sm text-slate-600 mt-1">Capturing... hold the sign steady!</p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={startCapture}
                    disabled={isCapturing || handCount === 0 || !detectorReady}
                    className={`flex-1 ${isCapturing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  >
                    {isCapturing ? '⏺ Recording...' : '⏺ Capture Samples'}
                  </Button>
                  <Button variant="outline" onClick={clearSamples} disabled={samples.length === 0}>
                    Clear
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold text-slate-800 mb-3">Samples Collected</h3>
                <div className="text-center py-4">
                  <div className={`text-5xl font-bold mb-1 ${samples.length >= 30 ? 'text-green-600' : samples.length >= 10 ? 'text-yellow-600' : 'text-slate-400'}`}>
                    {samples.length}
                  </div>
                  <p className="text-xs text-slate-500">Need minimum 10</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (samples.length / 50) * 100)}%` }} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  {samples.length < 10 ? `${10 - samples.length} more needed` : samples.length < 30 ? 'Good! More = better accuracy' : '✅ Great amount!'}
                </p>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold text-slate-800 mb-3">Instructions</h3>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Show your hand making the "<strong>{signName}</strong>" sign</li>
                  <li>Keep it inside the camera frame</li>
                  <li>Click <strong>Capture Samples</strong></li>
                  <li>Vary angle slightly for better accuracy</li>
                  <li>Aim for 30+ samples</li>
                </ol>
              </Card>

              <Button
                onClick={handleTrain}
                disabled={samples.length < 10}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                {samples.length < 10 ? `Need ${10 - samples.length} more samples` : '🧠 Train Model →'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Training */}
        {step === 'train' && (
          <Card className="p-10 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Training Model...</h2>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div className="h-3 bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${trainProgress}%` }} />
            </div>
            <p className="text-slate-600 text-sm">{trainProgress}% complete — Accuracy: {trainAcc}%</p>
            <p className="text-xs text-slate-400 mt-2">This may take a moment...</p>
          </Card>
        )}

        {/* STEP 4: Done */}
        {step === 'done' && (
          <Card className="p-10 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Sign Created!</h2>
            <p className="text-slate-600 mb-2">
              <strong>"{signName}"</strong> has been saved with a trained model using <strong>{samples.length} samples</strong>.
            </p>
            <p className="text-sm text-green-600 font-medium mb-8">Model trained successfully ✅</p>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/teacher/dashboard')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={() => { setStep('details'); setSignName(''); setDescription(''); setSelectedCategory(''); setSamples([]); setSavedSignId(null); setIsTrained(false); }} className="flex-1">
                Add Another Sign
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
