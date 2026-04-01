'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  Sun,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Info,
  Droplets,
  Palette,
  Heart,
  ArrowRight,
  Loader2,
  ExternalLink,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  analyzeLighting,
  extractFacePixels,
  classifySkinTone,
  recommendFoundation,
  type LightingResult,
  type SkinToneResult,
  type FoundationResult,
} from '@/lib/skin-analysis';
import { loadCatalog, findMatchingSkinTone, getProductsForSkinTone, getCategoryName, type Catalog, type Product } from '@/lib/catalog';

type Step = 'welcome' | 'capture' | 'lighting' | 'analyzing' | 'results';

// =============================================
// Main Widget Component
// =============================================

export default function FaceAnalysisWidget() {
  const [step, setStep] = useState<Step>('welcome');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capture state
  const [captureMethod, setCaptureMethod] = useState<'camera' | 'upload' | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Analysis state
  const [lightingResult, setLightingResult] = useState<LightingResult | null>(null);
  const [skinToneResult, setSkinToneResult] = useState<SkinToneResult | null>(null);
  const [foundationResult, setFoundationResult] = useState<FoundationResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Catalog state
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load face-api models on mount
  useEffect(() => {
    if (modelsLoaded || loadingModels) return;
    setLoadingModels(true);

    import('@vladmandic/face-api').then(async (faceapi) => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Erro ao carregar modelos de detecção facial. Recarregue a página.');
      } finally {
        setLoadingModels(false);
      }
    }).catch((err) => {
      console.error('Error importing face-api:', err);
      setError('Erro ao importar biblioteca de detecção facial.');
      setLoadingModels(false);
    });
  }, [modelsLoaded, loadingModels]);

  // Load product catalog on mount
  useEffect(() => {
    loadCatalog().then(setCatalog).catch(() => {});
  }, []);

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoStream]);

  // =============================================
  // Attach stream to video element whenever stream or method changes
  useEffect(() => {
    if (videoStream && captureMethod === 'camera' && videoRef.current) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(() => {});
    }
  }, [videoStream, captureMethod]);

  // Camera Functions
  // =============================================

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setVideoStream(stream);
      setCaptureMethod('camera');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImageDataUrl(dataUrl);
    // Stop camera
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    // Proceed to lighting check
    checkLighting(canvas);
  }, [videoStream]);

  // =============================================
  // Upload Functions
  // =============================================

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        // Scale down if needed
        const maxSize = 640;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImageDataUrl(dataUrl);
        checkLighting(canvas);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // =============================================
  // Analysis Pipeline
  // =============================================

  const checkLighting = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = analyzeLighting(imageData);
    setLightingResult(result);
    setStep('lighting');
  }, []);

  const proceedToAnalysis = useCallback(async () => {
    if (!canvasRef.current) return;
    setStep('analyzing');
    setAnalysisProgress(0);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const faceapi = await import('@vladmandic/face-api');

      // Animate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 85);
        setAnalysisProgress(progress);
      }, 300);

      // Detect face
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.4,
        }))
        .withFaceLandmarks();

      clearInterval(progressInterval);
      setAnalysisProgress(90);

      // If no face detected, stop and show error
      if (!detection) {
        clearInterval(progressInterval);
        setError('Nenhum rosto foi detectado na imagem. Por favor, envie uma foto clara do seu rosto, de frente, com boa iluminação.');
        setStep('capture');
        setImageDataUrl(null);
        return;
      }

      // Check detection confidence - low confidence means probably not a real face
      if (detection.detection.score < 0.5) {
        clearInterval(progressInterval);
        setError('A detecção do rosto teve baixa confiança. Tente uma foto com melhor iluminação e o rosto bem visível.');
        setStep('capture');
        setImageDataUrl(null);
        return;
      }

      // Extract landmarks from detected face (already in canvas coordinates)
      const landmarks = detection.landmarks.positions.map((p) => ({
        x: p.x,
        y: p.y,
      }));

      // Extract skin pixels from face landmarks
      const pixels = extractFacePixels(imageData, landmarks);

      // Check if we got enough skin pixels for reliable analysis
      if (pixels.length < 5) {
        clearInterval(progressInterval);
        setError('Não foi possível extrair pixels de pele suficientes. Tente uma foto com o rosto mais iluminado e sem sombras.');
        setStep('capture');
        setImageDataUrl(null);
        return;
      }

      // Classify skin tone
      const skinTone = classifySkinTone(pixels);
      setSkinToneResult(skinTone);

      // Recommend foundation (using catalog data for names, descriptions, tips)
      const foundation = recommendFoundation(skinTone, catalog?.skinTones);
      setFoundationResult(foundation);

      // Find matching skin tone and its products
      if (catalog) {
        const match = findMatchingSkinTone(catalog, skinTone.undertone, skinTone.depth);
        if (match) {
          setRecommendedProducts(getProductsForSkinTone(catalog, match.id));
        }
      }

      setAnalysisProgress(100);

      setTimeout(() => {
        setStep('results');
      }, 500);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Erro durante a análise facial. Tente novamente.');
      setStep('capture');
    }
  }, [catalog]);

  // No fallback — if no face is detected, analysis is blocked

  // =============================================
  // Reset
  // =============================================

  const resetWidget = useCallback(() => {
    setStep('welcome');
    setCaptureMethod(null);
    setImageDataUrl(null);
    setLightingResult(null);
    setSkinToneResult(null);
    setFoundationResult(null);
    setAnalysisProgress(0);
    setError(null);
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
  }, [videoStream]);

  const goBackToCapture = useCallback(() => {
    setStep('capture');
    setCaptureMethod(null);
    setImageDataUrl(null);
    setLightingResult(null);
    setError(null);
  }, []);

  // =============================================
  // Render Steps
  // =============================================

  const slideVariants = {
    enter: { x: 40, opacity: 0.8 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0.8 },
  };

  return (
    <div className="w-full sm:max-w-[480px] sm:mx-auto min-h-[calc(100dvh-env(safe-area-inset-bottom))] sm:min-h-0 flex flex-col sm:flex-none">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Card className="border-0 sm:shadow-xl sm:bg-white/80 sm:backdrop-blur-sm bg-white overflow-hidden flex-1 sm:flex-none flex flex-col sm:rounded-2xl rounded-none">
              <div className="bg-gradient-to-br from-rose-400 via-pink-400 to-orange-300 p-5 sm:p-8 text-center shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 sm:backdrop-blur-sm mb-4"
                >
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Encontre sua Base Perfeita
                </h1>
                <p className="text-white/90 text-sm leading-relaxed">
                  Descubra o tom ideal de base de maquiagem com análise inteligente do seu tom de pele.
                </p>
              </div>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  <FeatureItem
                    icon={<Camera className="w-5 h-5 text-rose-500" />}
                    title="Captura Facial"
                    description="Tire uma foto ou envie uma imagem do seu rosto"
                  />
                  <FeatureItem
                    icon={<Sun className="w-5 h-5 text-rose-500" />}
                    title="Verificação de Iluminação"
                    description="Garantimos condições ideais para análise precisa"
                  />
                  <FeatureItem
                    icon={<Palette className="w-5 h-5 text-rose-500" />}
                    title="Análise do Tom de Pele"
                    description="Detectamos undertone e profundidade da sua pele"
                  />
                  <FeatureItem
                    icon={<Droplets className="w-5 h-5 text-rose-500" />}
                    title="Recomendação Personalizada"
                    description="Receba a cor de base ideal com dicas de aplicação"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => {
                    if (!modelsLoaded) {
                      setError('Modelos ainda estão carregando. Aguarde...');
                      return;
                    }
                    setStep('capture');
                    setError(null);
                  }}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-4 sm:py-6 rounded-xl text-base shadow-lg shadow-rose-200 transition-all duration-300 hover:shadow-xl hover:shadow-rose-300 active:scale-[0.98]"
                  disabled={loadingModels}
                >
                  {loadingModels ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Carregando modelos IA...
                    </>
                  ) : (
                    <>
                      Começar Análise
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-slate-400 mt-2">
                  100% offline • Suas fotos nunca saem do seu dispositivo
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Capture */}
        {step === 'capture' && (
          <motion.div
            key="capture"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Card className="border-0 sm:shadow-xl sm:bg-white/80 sm:backdrop-blur-sm bg-white overflow-hidden flex-1 sm:flex-none flex flex-col sm:rounded-2xl rounded-none">
              <div className="p-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-semibold text-slate-800">Capturar Foto</h2>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Escolha como deseja enviar sua foto para análise
                </p>
              </div>

              <CardContent className="p-4 sm:p-6 space-y-4">
                {!captureMethod && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Card
                        className="cursor-pointer border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/50 hover:bg-rose-50 transition-all duration-200"
                        onClick={startCamera}
                      >
                        <CardContent className="p-4 sm:p-6 text-center space-y-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-100">
                            <Camera className="w-7 h-7 text-rose-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Usar Câmera</p>
                            <p className="text-xs text-slate-500 mt-1">Tire uma foto agora</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Card
                        className="cursor-pointer border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/50 hover:bg-orange-50 transition-all duration-200"
                        onClick={() => {
                          setCaptureMethod('upload');
                          setTimeout(() => fileInputRef.current?.click(), 100);
                        }}
                      >
                        <CardContent className="p-4 sm:p-6 text-center space-y-3">
                          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-100">
                            <Upload className="w-7 h-7 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Enviar Foto</p>
                            <p className="text-xs text-slate-500 mt-1">Escolha do seu dispositivo</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )}

                {/* Camera View */}
                {captureMethod === 'camera' && !imageDataUrl && (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        controls={false}
                        onLoadedMetadata={() => {
                          videoRef.current?.play().catch(() => {});
                        }}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none">
                        <div className="absolute top-4 left-4 right-4 h-16 border-b-2 border-white/20" />
                        <div className="absolute bottom-4 left-4 right-4 h-16 border-t-2 border-white/20" />
                        <div className="absolute top-4 left-4 bottom-4 w-16 border-r-2 border-white/20" />
                        <div className="absolute top-4 right-4 bottom-4 w-16 border-l-2 border-white/20" />
                      </div>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                        <p className="text-white/80 text-xs bg-black/40 px-3 py-1 rounded-full">
                          Posicione o rosto no centro
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={capturePhoto}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-4 sm:py-6 rounded-xl shadow-lg shadow-rose-200 active:scale-[0.98]"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Capturar Foto
                    </Button>
                  </div>
                )}

                {/* Upload area */}
                {captureMethod === 'upload' && !imageDataUrl && (
                  <div className="space-y-4">
                    <Card
                      className="cursor-pointer border-2 border-dashed border-orange-200 hover:border-orange-400 transition-all duration-200"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <CardContent className="p-5 sm:p-8 text-center space-y-3">
                        <Upload className="w-10 h-10 text-orange-400 mx-auto" />
                        <div>
                          <p className="font-semibold text-slate-800">Clique para enviar uma foto</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Formatos aceitos: JPG, PNG • Max 10MB
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Image Preview after capture/upload */}
                {imageDataUrl && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 font-medium">Foto capturada:</p>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <img
                        src={imageDataUrl}
                        alt="Foto capturada"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={goBackToCapture}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refazer
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 text-center">
                      Analisando iluminação...
                    </p>
                  </div>
                )}

                {/* Error Message - Face not detected */}
                {error && !captureMethod && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-red-700 text-sm">Rosto não detectado</p>
                        <p className="text-red-600 text-sm leading-relaxed">{error}</p>
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-red-700">Dicas para uma boa foto:</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Rosto de frente, olhando para a câmera
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Boa iluminação (luz natural perto de uma janela)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Sem óculos escuros, máscara ou acessórios cobrindo o rosto
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          Rosto visível do topo da cabeça até o queixo
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                <Button
                  variant="ghost"
                  onClick={() => { setError(null); setStep('welcome'); }}
                  className="w-full text-slate-500"
                >
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Lighting Check */}
        {step === 'lighting' && lightingResult && (
          <motion.div
            key="lighting"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Card className="border-0 sm:shadow-xl sm:bg-white/80 sm:backdrop-blur-sm bg-white overflow-hidden flex-1 sm:flex-none flex flex-col sm:rounded-2xl rounded-none">
              <div className="p-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-semibold text-slate-800">Verificação de Iluminação</h2>
                </div>
              </div>

              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* Image Preview */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <img
                    src={imageDataUrl!}
                    alt="Foto capturada"
                    className="w-full h-auto"
                  />
                </div>

                {/* Lighting Result */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`p-4 rounded-xl ${
                    lightingResult.score >= 80
                      ? 'bg-green-50 border border-green-200'
                      : lightingResult.score >= 60
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {lightingResult.score >= 80 ? (
                      <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                    ) : lightingResult.score >= 60 ? (
                      <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800">
                        {lightingResult.score >= 80
                          ? 'Iluminação Perfeita!'
                          : lightingResult.score >= 60
                            ? 'Iluminação Adequada'
                            : 'Iluminação Não Ideal'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {lightingResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Lighting Score */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Qualidade da iluminação</span>
                      <span className="font-medium">{Math.round(lightingResult.score)}%</span>
                    </div>
                    <Progress
                      value={lightingResult.score}
                      className={`h-2 ${
                        lightingResult.score >= 80
                          ? '[&>div]:bg-green-500'
                          : lightingResult.score >= 60
                            ? '[&>div]:bg-yellow-500'
                            : '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>

                  {/* Info about brightness */}
                  <div className="mt-3 flex items-start gap-2 bg-white/50 rounded-lg p-2.5">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500">
                      Brilho:{' '}
                      {lightingResult.brightness === 'low'
                        ? 'Baixo'
                        : lightingResult.brightness === 'medium'
                          ? 'Médio'
                          : 'Alto'}
                    </p>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {lightingResult.score >= 60 ? (
                    <Button
                      onClick={proceedToAnalysis}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-4 sm:py-6 rounded-xl shadow-lg shadow-rose-200 active:scale-[0.98]"
                    >
                      Continuar para Análise
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={proceedToAnalysis}
                      variant="outline"
                      className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 py-4 sm:py-6 rounded-xl active:scale-[0.98]"
                    >
                      Continuar Mesmo Assim
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={goBackToCapture}
                    className="w-full text-slate-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente com Outra Foto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Analyzing */}
        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Card className="border-0 sm:shadow-xl sm:bg-white/80 sm:backdrop-blur-sm bg-white overflow-hidden flex-1 sm:flex-none flex flex-col sm:rounded-2xl rounded-none">
              <CardContent className="p-5 sm:p-8 space-y-5 sm:space-y-6">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-rose-100 to-orange-100"
                  >
                    <Sparkles className="w-7 h-7 sm:w-10 sm:h-10 text-rose-500" />
                  </motion.div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Analisando seu Tom de Pele</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Detectando rosto e calculando a cor ideal...
                    </p>
                  </div>

                  <div className="space-y-2 px-4">
                    <Progress
                      value={analysisProgress}
                      className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-pink-500 transition-all duration-300"
                    />
                    <p className="text-xs text-slate-400 text-right">
                      {Math.round(analysisProgress)}%
                    </p>
                  </div>

                  {/* Animated steps */}
                  <div className="space-y-3 text-left max-w-xs mx-auto">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: analysisProgress > 10 ? 1 : 0.3, x: 0 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      {analysisProgress > 20 ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-slate-300 shrink-0 animate-spin" />
                      )}
                      <span className={analysisProgress > 20 ? 'text-slate-700' : 'text-slate-400'}>
                        Detectando rosto na imagem
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: analysisProgress > 30 ? 1 : 0.3, x: 0 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      {analysisProgress > 50 ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-slate-300 shrink-0 animate-spin" />
                      )}
                      <span className={analysisProgress > 50 ? 'text-slate-700' : 'text-slate-400'}>
                        Extraindo pixels da pele
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: analysisProgress > 60 ? 1 : 0.3, x: 0 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      {analysisProgress > 80 ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-slate-300 shrink-0 animate-spin" />
                      )}
                      <span className={analysisProgress > 80 ? 'text-slate-700' : 'text-slate-400'}>
                        Classificando tom e undertone
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: analysisProgress > 90 ? 1 : 0.3, x: 0 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      {analysisProgress >= 100 ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-slate-300 shrink-0 animate-spin" />
                      )}
                      <span className={analysisProgress >= 100 ? 'text-slate-700' : 'text-slate-400'}>
                        Gerando recomendação
                      </span>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Results */}
        {step === 'results' && foundationResult && skinToneResult && (
          <motion.div
            key="results"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Card className="border-0 sm:shadow-xl sm:bg-white/80 sm:backdrop-blur-sm bg-white overflow-hidden flex-1 sm:flex-none flex flex-col sm:rounded-2xl rounded-none">
              {/* Header */}
              <div className="bg-gradient-to-br from-rose-400 via-pink-400 to-orange-300 p-5 text-center text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-2"
                >
                  <Heart className="w-6 h-6 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold">Sua Base Ideal</h2>
                <p className="text-white/80 text-sm mt-1">Resultado da análise do seu tom de pele</p>
              </div>

              <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                {/* Color Swatch */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center space-y-3"
                >
                  <div className="flex justify-center">
                    <div
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full shadow-lg border-4 border-white"
                      style={{ backgroundColor: foundationResult.colorHex }}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {foundationResult.colorName}
                    </p>
                    <p className="text-sm text-slate-500 font-mono">
                      {foundationResult.colorHex.toUpperCase()}
                    </p>
                  </div>
                </motion.div>

                {/* Undertone & Depth */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 gap-2 sm:gap-3"
                >
                  <div className="bg-rose-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-rose-400 font-medium uppercase tracking-wider mb-1">
                      Undertone
                    </p>
                    <p className="font-bold text-slate-800">
                      {skinToneResult.undertone === 'Warm'
                        ? 'Quente'
                        : skinToneResult.undertone === 'Cool'
                          ? 'Frio'
                          : 'Neutro'}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">
                      Profundidade
                    </p>
                    <p className="font-bold text-slate-800">
                      {skinToneResult.depth === 'Fair'
                        ? 'Muito Clara'
                        : skinToneResult.depth === 'Light'
                          ? 'Clara'
                          : skinToneResult.depth === 'Medium'
                            ? 'Média'
                            : skinToneResult.depth === 'Tan'
                              ? 'Morena'
                              : 'Escura'}
                    </p>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100"
                >
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {foundationResult.description}
                  </p>
                </motion.div>

                {/* Recommended Products */}
                {recommendedProducts.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3"
                  >
                    <Separator />
                    <p className="font-semibold text-slate-800 flex items-center gap-2 pt-2">
                      <ShoppingBag className="w-4 h-4 text-rose-500" />
                      Produtos Recomendados
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {recommendedProducts.map((product, i) => (
                        <motion.a
                          key={product.id}
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.6 + i * 0.08 }}
                          className="group flex flex-col items-center p-2.5 sm:p-3 rounded-xl bg-white border border-slate-100 hover:border-rose-200 hover:shadow-md transition-all duration-200 text-center"
                        >
                          {/* Product Image */}
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden mb-1.5 sm:mb-2 flex items-center justify-center shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          {/* Product Name */}
                          <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-tight">
                            {product.name}
                          </p>
                          {/* Category Badge */}
                          <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-medium">
                            <Tag className="w-2.5 h-2.5" />
                            {getCategoryName(catalog!, product.category)}
                          </span>
                          {/* External link indicator */}
                          <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-rose-400 mt-1.5 transition-colors" />
                        </motion.a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* No products message (subtle) */}
                {recommendedProducts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center py-3"
                  >
                    <p className="text-xs text-slate-400">
                      Nenhum produto cadastrado para este tom ainda.
                    </p>
                  </motion.div>
                )}

                {/* Tips */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2"
                >
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    Dicas de Aplicação
                  </p>
                  <div className="space-y-2">
                    {foundationResult.tips.map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex items-start gap-2 p-2 sm:p-2.5 bg-slate-50 rounded-lg"
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-600 leading-relaxed">{tip}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={resetWidget}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-4 sm:py-6 rounded-xl shadow-lg shadow-rose-200 active:scale-[0.98]"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refazer Análise
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Error State */}
        {error && step !== 'welcome' && step !== 'lighting' && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <Card className="max-w-sm w-full">
              <CardContent className="p-6 text-center space-y-4">
                <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                <div>
                  <p className="font-semibold text-slate-800">Ops!</p>
                  <p className="text-sm text-slate-500 mt-1">{error}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      setStep('welcome');
                    }}
                    className="flex-1"
                  >
                    Voltar ao Início
                  </Button>
                  <Button
                    onClick={() => {
                      setError(null);
                    }}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================
// Helper Components
// =============================================

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-rose-50/50 transition-colors">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-slate-800 text-sm">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
