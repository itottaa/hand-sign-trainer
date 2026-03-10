'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase, HandSign, PracticeSession } from '@/lib/supabase';
import { CameraFeed } from '@/components/camera-feed';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  initializeHandDetector,
  detectHands,
  drawHands,
  normalizeKeypoints,
  hasHandDetected,
  getHandCount,
  DetectedHand,
} from '@/lib/hand-detection';
import { predict, loadModel } from '@/lib/model-training';
import Link from 'next/link';

interface SignDetails extends HandSign {
  category_name?: string;
}

export default function PracticePage() {
  const params = useParams();
  const signId = params.signId as string;
  const { user, isStudent } = useAuth();
  const router = useRouter();

  const [sign, setSign] = useState<SignDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPracticing, setIsPracticing] = useState(false);
  const [detectorReady, setDetectorReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const [hands, setHands] = useState<DetectedHand[]>([]);
  const [handCount, setHandCount] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [predictedLabel, setPredictedLabel] = useState('');

  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handsRef = useRef<DetectedHand[]>([]);
  const frameRef = useRef(0);
  const isPracticingRef = useRef(false);

  useEffect(() => {
    if (isStudent) fetchSignDetails();
  }, [signId, isStudent]);

  useEffect(() => {
    isPracticingRef.current = isPracticing;
  }, [isPracticing]);

  const fetchSignDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('hand_signs')
        .select('*, sign_categories(name)')
        .eq('id', signId)
        .single();
      if (error) throw error;
      setSign({ ...data, category_name: data.sign_categories?.name });

      const { data: sessions } = await supabase
        .from('practice_sessions')
        .select('best_score, attempts')
        .eq('student_id', user?.id)
        .eq('sign_id', signId)
        .order('best_score', { ascending: false })
        .limit(1);

      if (sessions?.[0]) {
        setBestScore(sessions[0].best_score);
        setAttempts(sessions[0].attempts || 0);
      }
    } catch (err) {
      console.error('Error fetching sign:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async () => {
    setFeedback('Loading hand detector...');
    const detOk = await initializeHandDetector();
    setDetectorReady(detOk);

    if (!detOk) { setFeedback('Hand detector failed to load'); return; }

    // Try loading model for this sign
    const loadedModel = await loadModel(`sign-${signId}`);
    setModelLoaded(!!loadedModel);
    if (!loadedModel) {
      setFeedback('No trained model yet. Teacher needs to train this sign first.');
    } else {
      setFeedback('Show your hand to the camera!');
    }

    setIsPracticing(true);
    setAccuracy(null);
    setSessionScores([]);
  };

  const handleFrameCapture = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!isPracticingRef.current || !detectorReady) return;

    frameRef.current++;
    if (frameRef.current % 8 !== 0) return; // throttle

    const detected = await detectHands(canvas);
    handsRef.current = detected;
    setHands(detected);
    setHandCount(detected.length);

    if (!hasHandDetected(detected)) {
      setFeedback('Show your hand to the camera');
      setAccuracy(null);
      setPredictedLabel('');
      return;
    }

    if (!modelLoaded) {
      setFeedback('✋ Hand detected! But no model trained yet.');
      return;
    }

    try {
      const kp = normalizeKeypoints(detected[0].landmarks);
      if (kp.length === 42) {
        const result = predict(kp);
        if (result) {
          const pct = Math.round(result.confidence * 100);
          setAccuracy(pct);
          setPredictedLabel(result.label);
          setSessionScores(prev => [...prev.slice(-19), pct]);

          if (pct >= 85) setFeedback('🌟 Excellent! Perfect sign!');
          else if (pct >= 70) setFeedback('👍 Great! Keep it up!');
          else if (pct >= 50) setFeedback('🙂 Getting there, adjust your hand');
          else setFeedback('💪 Keep practicing!');
        }
      }
    } catch {}
  }, [detectorReady, modelLoaded]);

  const handleDrawCallback = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    drawHands(ctx, handsRef.current, w, h);

    // Accuracy overlay
    if (accuracy !== null) {
      const color = accuracy >= 70 ? '#22c55e' : accuracy >= 50 ? '#f59e0b' : '#ef4444';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(w - 120, 10, 110, 36);
      ctx.fillStyle = color;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${accuracy}%`, w - 100, 36);
    }
  }, [accuracy]);

  const handleStopPractice = async () => {
    setIsPracticing(false);
    if (sessionScores.length > 0) await savePracticeSession();
  };

  const savePracticeSession = async () => {
    if (!sign || !user || sessionScores.length === 0) return;
    setIsSaving(true);
    try {
      const avgScore = Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length);
      const newBest = Math.max(avgScore, bestScore);

      await supabase.from('practice_sessions').insert({
        student_id: user.id,
        sign_id: sign.id,
        accuracy_score: avgScore,
        attempts: attempts + 1,
        best_score: newBest,
      });

      setAttempts(p => p + 1);
      setBestScore(newBest);
      setFeedback(`Session saved! Avg: ${avgScore}% | Best: ${newBest}%`);
    } catch (err) {
      console.error('Error saving session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : 0;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!sign) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">Sign not found.</p>
        <Link href="/student/dashboard"><Button>Back</Button></Link>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/student/dashboard" className="text-blue-600 hover:underline text-sm block mb-1">← Back to Dashboard</Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{sign.name}</h1>
              <p className="text-slate-500 text-sm">{sign.category_name} · {sign.difficulty}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${handCount > 0 && isPracticing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              ✋ {handCount} hand{handCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <h2 className="font-semibold text-slate-800 mb-3">📷 Camera Feed</h2>
              <CameraFeed
                onFrameCapture={handleFrameCapture}
                drawCallback={handleDrawCallback}
                active={isPracticing}
                label={isPracticing ? 'Practicing' : undefined}
              />

              {!isPracticing ? (
                <Button onClick={handleStartPractice} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3">
                  ▶ Start Practice
                </Button>
              ) : (
                <Button onClick={handleStopPractice} disabled={isSaving} className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-3">
                  {isSaving ? 'Saving...' : '⏹ Stop & Save'}
                </Button>
              )}

              {feedback && (
                <p className={`text-center text-sm font-medium mt-3 ${accuracy && accuracy >= 70 ? 'text-green-600' : 'text-slate-600'}`}>
                  {feedback}
                </p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Live Score */}
            <Card className={`p-5 ${accuracy !== null ? 'border-2 ' + (accuracy >= 70 ? 'border-green-400' : accuracy >= 50 ? 'border-yellow-400' : 'border-red-400') : ''}`}>
              <h3 className="font-semibold text-slate-800 mb-3">Live Score</h3>
              {accuracy !== null ? (
                <>
                  <div className={`text-5xl font-bold text-center mb-2 ${accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {accuracy}%
                  </div>
                  {predictedLabel && (
                    <p className="text-center text-sm text-slate-500 mb-2">Detected: <strong>{predictedLabel}</strong></p>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-300 ${accuracy >= 70 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${accuracy}%` }} />
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <div className="text-3xl mb-2">👋</div>
                  <p className="text-sm">{isPracticing ? 'Show your hand' : 'Press Start'}</p>
                </div>
              )}
            </Card>

            {/* Hand count */}
            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Hand Detection</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Hands visible</span>
                <div className="flex gap-2">
                  {[1, 2].map(n => (
                    <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${handCount >= n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Session stats */}
            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Session Avg</span>
                  <span className="font-bold text-blue-600">{avgScore > 0 ? `${avgScore}%` : '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Best Score</span>
                  <span className="font-bold text-green-600">{bestScore > 0 ? `${bestScore}%` : '--'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Sessions</span>
                  <span className="font-bold text-slate-700">{attempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Difficulty</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sign.difficulty === 'easy' ? 'bg-green-100 text-green-700' : sign.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {sign.difficulty}
                  </span>
                </div>
              </div>
            </Card>

            {/* Description */}
            {sign.description && (
              <Card className="p-5">
                <h3 className="font-semibold text-slate-800 mb-2">Instructions</h3>
                <p className="text-sm text-slate-600">{sign.description}</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
