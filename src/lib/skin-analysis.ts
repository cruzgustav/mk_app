// =============================================
// Skin Analysis Module - Facial Analysis for Makeup Foundation
// All logic runs client-side in the browser
// =============================================

export type LightingResult = {
  isGood: boolean;
  brightness: 'low' | 'medium' | 'high';
  message: string;
  score: number;
};

export type SkinToneResult = {
  undertone: 'Warm' | 'Cool' | 'Neutral';
  depth: 'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep';
  dominantColor: string;
  labValues: { L: number; a: number; b: number };
};

export type FoundationResult = {
  colorHex: string;
  colorName: string;
  undertone: string;
  depth: string;
  description: string;
  tips: string[];
};

// =============================================
// Lighting Analysis
// =============================================

export function analyzeLighting(imageData: ImageData): LightingResult {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  // Calculate average luminance per quadrant
  const quadrantLuminances: number[] = [0, 0, 0, 0];
  const quadrantCounts: number[] = [0, 0, 0, 0];

  let totalLuminance = 0;
  const luminances: number[] = [];

  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // BT.601 luminance
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      luminances.push(Y);
      totalLuminance += Y;

      // Determine quadrant
      const qIdx = (x < halfW ? 0 : 1) + (y < halfH ? 0 : 2);
      quadrantLuminances[qIdx] += Y;
      quadrantCounts[qIdx]++;
    }
  }

  const avgLuminance = totalLuminance / totalPixels;

  // Standard deviation of luminance
  let sumSqDiff = 0;
  for (const lum of luminances) {
    sumSqDiff += (lum - avgLuminance) ** 2;
  }
  const stdDev = Math.sqrt(sumSqDiff / totalPixels);

  // Quadrant uniformity
  const avgQuads = quadrantLuminances.map((sum, i) => sum / quadrantCounts[i]);
  const maxQuadDiff = Math.max(...avgQuads) - Math.min(...avgQuads);

  // Determine brightness level
  let brightness: 'low' | 'medium' | 'high';
  if (avgLuminance < 80) {
    brightness = 'low';
  } else if (avgLuminance > 220) {
    brightness = 'high';
  } else {
    brightness = 'medium';
  }

  // Scoring (0-100)
  let score = 0;

  // Luminance score (ideal: 120-200)
  if (avgLuminance >= 120 && avgLuminance <= 200) {
    score += 40;
  } else if (avgLuminance >= 80 && avgLuminance < 120) {
    score += 20;
  } else if (avgLuminance > 200 && avgLuminance <= 220) {
    score += 25;
  }

  // Standard deviation score (ideal: 30-70)
  if (stdDev >= 30 && stdDev <= 70) {
    score += 30;
  } else if (stdDev >= 20 && stdDev < 30) {
    score += 20;
  } else if (stdDev > 70 && stdDev <= 90) {
    score += 15;
  }

  // Uniformity score (ideal: max quad diff < 40)
  if (maxQuadDiff < 40) {
    score += 30;
  } else if (maxQuadDiff < 60) {
    score += 15;
  } else if (maxQuadDiff < 80) {
    score += 5;
  }

  const isGood = score >= 60;

  // Generate message
  let message: string;
  if (avgLuminance < 80) {
    message = 'Muito escuro! Procure um local com luz natural ou aumente a iluminação do ambiente.';
  } else if (avgLuminance > 220) {
    message = 'Muito claro! Evite usar flash direto ou luz muito forte. Procure iluminação suave.';
  } else if (stdDev < 20) {
    message = 'A iluminação está um pouco plana. Tente posicionar-se perto de uma janela para obter melhor resultado.';
  } else if (maxQuadDiff >= 60) {
    message = 'A iluminação não está uniforme. Evite sombras parciais no rosto. Posicione-se de frente para a luz.';
  } else if (score >= 80) {
    message = 'Iluminação perfeita! Sua foto tem luz adequada para uma análise precisa.';
  } else if (score >= 60) {
    message = 'Iluminação adequada. O resultado será razoavelmente preciso.';
  } else {
    message = 'A iluminação pode comprometer a precisão. Procure luz natural perto de uma janela.';
  }

  return { isGood, brightness, message, score };
}

// =============================================
// Face Pixel Extraction
// =============================================

interface LandmarkPoint {
  x: number;
  y: number;
}

export function extractFacePixels(
  imageData: ImageData,
  landmarks: LandmarkPoint[]
): number[][] {
  const { data, width, height } = imageData;

  // Define regions based on 68-point landmark model:
  // Jaw: points 0-16
  // Left eyebrow: points 17-21
  // Right eyebrow: points 22-26
  // Nose bridge: points 27-30
  // Nose bottom: points 31-35
  // Left eye: points 36-41
  // Right eye: points 42-47
  // Outer lip: points 48-59
  // Inner lip: points 60-67

  // Cheek regions:
  // Left cheek: area around points 1-5 (jawline) and 36 (left eye outer)
  // Right cheek: area around points 11-15 (jawline) and 45 (right eye outer)
  // Forehead: area above points 17-26 (eyebrows)

  const allPixels: number[][] = [];

  // Helper: sample pixels in a region defined by a center and radius
  function sampleRegion(centerX: number, centerY: number, radiusX: number, radiusY: number) {
    const x0 = Math.max(0, Math.floor(centerX - radiusX));
    const x1 = Math.min(width - 1, Math.floor(centerX + radiusX));
    const y0 = Math.max(0, Math.floor(centerY - radiusY));
    const y1 = Math.min(height - 1, Math.floor(centerY + radiusY));

    for (let y = y0; y <= y1; y += 2) {
      for (let x = x0; x <= x1; x += 2) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Filter out very dark or very bright pixels (shadows, highlights, hair, eyes)
        if (r > 30 && g > 20 && b > 15 && r < 250 && g < 245 && b < 240) {
          // Filter pixels that look like skin (basic skin detection)
          // Skin has higher R than G, higher G than B typically
          if (r > g && g > b * 0.8 && (r - g) < 100) {
            allPixels.push([r, g, b]);
          }
        }
      }
    }
  }

  if (landmarks.length < 68) {
    // Fallback: if we don't have 68 points, sample from the general face region
    // Using what we have to estimate face center and size
    const avgX = landmarks.reduce((s, p) => s + p.x, 0) / landmarks.length;
    const avgY = landmarks.reduce((s, p) => s + p.y, 0) / landmarks.length;
    const maxX = Math.max(...landmarks.map(p => p.x));
    const minX = Math.min(...landmarks.map(p => p.x));
    const faceWidth = maxX - minX;
    sampleRegion(avgX, avgY, faceWidth * 0.3, faceWidth * 0.25);
    return filterOutliers(allPixels);
  }

  // Left cheek: center between jaw points 1-5 and left eye outer (36)
  const leftCheekX = (landmarks[1].x + landmarks[3].x + landmarks[36].x) / 3;
  const leftCheekY = (landmarks[2].y + landmarks[50].y) / 2;
  const faceWidth = landmarks[16].x - landmarks[0].x;
  sampleRegion(leftCheekX, leftCheekY, faceWidth * 0.15, faceWidth * 0.12);

  // Right cheek: center between jaw points 11-15 and right eye outer (45)
  const rightCheekX = (landmarks[11].x + landmarks[13].x + landmarks[45].x) / 3;
  const rightCheekY = (landmarks[12].y + landmarks[52].y) / 2;
  sampleRegion(rightCheekX, rightCheekY, faceWidth * 0.15, faceWidth * 0.12);

  // Forehead: above eyebrows (points 17-26)
  const foreheadX = (landmarks[21].x + landmarks[22].x) / 2;
  const foreheadY = (landmarks[19].y + landmarks[24].y) / 2 - faceWidth * 0.08;
  sampleRegion(foreheadX, foreheadY, faceWidth * 0.18, faceWidth * 0.06);

  // Also add nose bridge area (point 27-30) for center face color
  const noseX = (landmarks[27].x + landmarks[30].x) / 2;
  const noseY = (landmarks[28].y + landmarks[29].y) / 2;
  sampleRegion(noseX, noseY, faceWidth * 0.06, faceWidth * 0.08);

  return filterOutliers(allPixels);
}

// Filter outliers using Interquartile Range (IQR) method
function filterOutliers(pixels: number[][]): number[][] {
  if (pixels.length === 0) return [];

  // Convert to simple brightness for outlier detection
  const brightnesses = pixels.map(([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b);
  brightnesses.sort((a, b) => a - b);

  const q1 = brightnesses[Math.floor(brightnesses.length * 0.25)];
  const q3 = brightnesses[Math.floor(brightnesses.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return pixels.filter((_, idx) => {
    const b = brightnesses[idx];
    return b >= lowerBound && b <= upperBound;
  });
}

// =============================================
// Color Space Conversions
// =============================================

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // sRGB to Linear RGB
  let rl = r / 255;
  let gl = g / 255;
  let bl = b / 255;

  rl = rl <= 0.04045 ? rl / 12.92 : Math.pow((rl + 0.055) / 1.055, 2.4);
  gl = gl <= 0.04045 ? gl / 12.92 : Math.pow((gl + 0.055) / 1.055, 2.4);
  bl = bl <= 0.04045 ? bl / 12.92 : Math.pow((bl + 0.055) / 1.055, 2.4);

  // Linear RGB to XYZ (D65 illuminant)
  let x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  let y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  let z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041;

  // XYZ to LAB
  // D65 reference white
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;

  x /= xn;
  y /= yn;
  z /= zn;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [L, a, bVal];
}

export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  // LAB to XYZ
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const xr = Math.pow(fx, 3) > epsilon ? Math.pow(fx, 3) : (116 * fx - 16) / kappa;
  const yr = L > kappa * epsilon ? Math.pow((L + 16) / 116, 3) : L / kappa;
  const zr = Math.pow(fz, 3) > epsilon ? Math.pow(fz, 3) : (116 * fz - 16) / kappa;

  // D65 reference white
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;

  let x = xr * xn;
  let y = yr * yn;
  let z = zr * zn;

  // XYZ to Linear RGB
  let rl = x * 3.2404542 - y * 1.5371385 - z * 0.4985314;
  let gl = -x * 0.9692660 + y * 1.8760108 + z * 0.0415560;
  let bl = x * 0.0556434 - y * 0.2040259 + z * 1.0572252;

  // Linear RGB to sRGB (gamma correction)
  rl = rl <= 0.0031308 ? 12.92 * rl : 1.055 * Math.pow(rl, 1 / 2.4) - 0.055;
  gl = gl <= 0.0031308 ? 12.92 * gl : 1.055 * Math.pow(gl, 1 / 2.4) - 0.055;
  bl = bl <= 0.0031308 ? 12.92 * bl : 1.055 * Math.pow(bl, 1 / 2.4) - 0.055;

  // Clamp to 0-255
  const r = Math.max(0, Math.min(255, Math.round(rl * 255)));
  const g = Math.max(0, Math.min(255, Math.round(gl * 255)));
  const bVal = Math.max(0, Math.min(255, Math.round(bl * 255)));

  return [r, g, bVal];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return [h, s, v];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// =============================================
// Skin Tone Classification
// =============================================

export function classifySkinTone(rgbPixels: number[][]): SkinToneResult {
  if (rgbPixels.length === 0) {
    return {
      undertone: 'Neutral',
      depth: 'Medium',
      dominantColor: '#D2A679',
      labValues: { L: 60, a: 12, b: 18 },
    };
  }

  // Calculate average RGB
  let totalR = 0, totalG = 0, totalB = 0;
  let totalL = 0, totalA = 0, totalLabB = 0;

  for (const [r, g, b] of rgbPixels) {
    totalR += r;
    totalG += g;
    totalB += b;
    const [L, a, bVal] = rgbToLab(r, g, b);
    totalL += L;
    totalA += a;
    totalLabB += bVal;
  }

  const n = rgbPixels.length;
  const avgR = totalR / n;
  const avgG = totalG / n;
  const avgB = totalB / n;
  const avgL = totalL / n;
  const avgA = totalA / n;
  const avgLabB = totalLabB / n;

  // Also compute median LAB for robustness
  const labValues = rgbPixels.map(([r, g, b]) => rgbToLab(r, g, b));
  labValues.sort((a, b) => a[0] - b[0]);
  const mid = Math.floor(labValues.length / 2);
  const medianL = labValues[mid][0];
  const medianA = labValues[mid][1];
  const medianB = labValues[mid][2];

  // Use a blend of mean and median for robustness
  const finalL = (avgL + medianL) / 2;
  const finalA = (avgA + medianA) / 2;
  const finalB = (avgLabB + medianB) / 2;

  // Undertone classification
  let undertone: 'Warm' | 'Cool' | 'Neutral';
  if (finalB > 15 && finalA > 5) {
    undertone = 'Warm';
  } else if (finalB < 10 && finalA < 0) {
    undertone = 'Cool';
  } else {
    undertone = 'Neutral';
  }

  // Depth classification based on L*
  let depth: 'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep';
  if (finalL > 75) {
    depth = 'Fair';
  } else if (finalL >= 60) {
    depth = 'Light';
  } else if (finalL >= 45) {
    depth = 'Medium';
  } else if (finalL >= 30) {
    depth = 'Tan';
  } else {
    depth = 'Deep';
  }

  // Calculate dominant color from average
  const [dr, dg, db] = labToRgb(finalL, finalA, finalB);
  const dominantColor = rgbToHex(dr, dg, db);

  return {
    undertone,
    depth,
    dominantColor,
    labValues: { L: finalL, a: finalA, b: finalB },
  };
}

// =============================================
// Foundation Recommendation
// =============================================

export type SkinToneFromCatalog = {
  undertone: 'Warm' | 'Cool' | 'Neutral';
  depth: 'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep';
  colorHex: string;
  colorName: string;
  description?: string;
  tips?: string[];
};

// Default descriptions e tips (usados quando não há dados no catálogo)
const DEFAULT_DESCRIPTIONS: Record<string, Record<string, string>> = {
  Fair: {
    Cool: 'Uma base muito clara com subtons rosados, ideal para peles extremamente claras com tendência rosada. Esse tom ajuda a neutralizar qualquer vermelhidão natural e traz um ar saudável ao rosto.',
    Warm: 'Uma base muito clara com subtons dourados, perfeita para peles claras com calor amarelado. Combine com iluminadores perolados para um acabamento luminoso e sofisticado.',
    Neutral: 'Uma base muito clara com subtons neutros, adequada para peles claras sem tendências marcantes. É uma das tonalidades mais versáteis, funcionando bem tanto em looks naturais quanto elaborados.',
  },
  Light: {
    Cool: 'Uma base clara com subtons rosados suaves, ideal para peles claras com veias levemente azuladas. O tom frio equilibra a pele e evita que fique com aspecto acinzentado.',
    Warm: 'Uma base clara com subtons dourados, perfeita para peles que bronzeiam facilmente. O tom quente harmoniza naturalmente com a pele, evitando o efeito cinza.',
    Neutral: 'Uma base clara com subtons equilibrados, ideal para peles claras versáteis. É o tom coringa para quem não sabe exatamente se é quente ou frio.',
  },
  Medium: {
    Cool: 'Uma base média com subtons rosados, indicada para peles médias com tendência rosada. Perfeita para quem nota um tom levemente avermelhado ou rosado na pele.',
    Warm: 'Uma base média com subtons dourados, ideal para peles médias com calor natural. Traz luminosidade e é a tonalidade mais comum no Brasil.',
    Neutral: 'Uma base média com subtons neutros, adequada para a maioria das peles médias. Oferece cobertura uniforme sem alterar o tom natural da pele.',
  },
  Tan: {
    Cool: 'Uma base morena com subtons rosados, perfeita para peles morenas com tendência fria. O tom rosado traz frescor e evita que a pele pareça opaca.',
    Warm: 'Uma base morena com subtons dourados, indicada para peles morenas com calor natural. Valoriza o bronzeado e confere um acabamento ensolarado.',
    Neutral: 'Uma base morena com subtons neutros, ideal para peles morenas versáteis. É uma excelente opção para quem deseja um look natural e uniforme.',
  },
  Deep: {
    Cool: 'Uma base escura com subtons rosados profundos, ideal para peles escuras com tendência fria. Traz sofisticação e contraste elegante ao visual.',
    Warm: 'Uma base escura com subtons dourados, perfeita para peles escuras com calor natural. O tom quente realça a beleza natural da pele profunda.',
    Neutral: 'Uma base escura com subtons neutros, adequada para peles escuras versáteis. Garante cobertura impecável sem criar contraste indesejado.',
  },
};

const DEFAULT_TIPS: Record<string, Record<string, string[]>> = {
  Fair: {
    Cool: ['Aplique a base em camadas finas para evitar efeito máscara.', 'Use um primer hidratante para manter a pele luminosa.', 'Escolha um corretivo um tom mais claro para a área dos olhos.', 'Finalize com pó translúcido para controle de brilho.'],
    Warm: ['Hidrate bem a pele antes da aplicação para um acabamento natural.', 'Use uma esponja úmida para uma cobertura mais uniforme.', 'Cuidado para não escolher tons acinzentados que deixam a pele sem vida.', 'Aplique com movimentos de tape para melhor cobertura.'],
    Neutral: ['Sua pele combina com a maioria das bases médias do mercado.', 'Aplique do centro do rosto para fora para cobertura natural.', 'Use um pó compacto para fixar e prolongar a durabilidade.', 'Misture com hidratante para cobertura leve no dia a dia.'],
  },
  Light: {
    Cool: ['Combine a base com um corretivo de mesma família de tom.', 'Use iluminador suave no alto das bochechas para dimensão.', 'Evite bases muito amareladas que podem gerar contraste.', 'Aplique com pincel para acabamento mais profissional.'],
    Warm: ['Sua pele combina perfeitamente com tons dourados.', 'Use uma base líquida para acabamento natural e luminoso.', 'Aplique o blush em tons de coral ou pêssego para harmonizar.', 'Finalize com spray fixador para longa duração.'],
    Neutral: ['Você tem a vantagem de adaptar entre tons frios e quentes.', 'Teste a base na linha do maxilar para verificar o tom.', 'Use uma esponja para acabamento skin-like.', 'Aplique pó apenas na zona T para brilho controlado.'],
  },
  Medium: {
    Cool: ['Bases rosadas ajudam a neutralizar o amarelado natural.', 'Use primer com tom lilás para potencializar o efeito.', 'Aplique com pincel kabuki para cobertura média a alta.', 'O blush em tom rosa médio complementa perfeitamente.'],
    Warm: ['Bases douradas realçam a luminosidade natural da sua pele.', 'Use um primer com toque iluminador para efeito glow.', 'Aplique com esponja úmida para acabamento aveludado.', 'Blush em tons de terracota harmoniza com seu tom.'],
    Neutral: ['Seu tom de pele é muito versátil — aproveite!', 'Alterne entre acabamentos matte e dewy conforme o look.', 'Use base em creme para cobertura média natural.', 'Finalize com pó solto translúcido para fixação.'],
  },
  Tan: {
    Cool: ['Evite bases acinzentadas que podem deixar o tom opaco.', 'Use iluminador dourado para realçar a pele.', 'Aplique a base em camadas finas e construa a cobertura.', 'Blush em tom maçã para um visual saudável.'],
    Warm: ['Sua pele tem um brilho natural — destaque com base luminosa.', 'Use bronzer no tom certo para realçar ainda mais.', 'Aplique com os dedos para melhor derretimento na pele.', 'Finalize com spray para efeito fresh o dia todo.'],
    Neutral: ['Sua pele morena é perfeita para looks ensolarados.', 'Use base com proteção solar para proteção diária.', 'Aplique com esponja para acabamento natural.', 'Contorno suave valoriza os traços naturais.'],
  },
  Deep: {
    Cool: ['Evite bases muito claras que criam linha de demarcação.', 'Use corretivo laranja para cobrir olheiras profundas.', 'Aplique base com pincel denso para cobertura uniforme.', 'Finalize com pó compacto translúcido para fixação matte.'],
    Warm: ['Bases em tons de caramelo dourado são suas aliadas.', 'Use iluminador em tom bronze para realçar a pele.', 'Aplique com esponja para melhor aderência.', 'Blush em tom coral médio complementa seu tom.'],
    Neutral: ['Procure bases com rótulos "for deep skin tones".', 'Aplique do centro para fora para acabamento natural.', 'Use primer com silicone para melhor aplicação.', 'Finalize com spray fixador para longa duração.'],
  },
};

/**
 * recommendFoundation — gera resultado de recomendação.
 * Se receber skinTones do catálogo, usa os dados configurados.
 * Caso contrário, usa os defaults hardcoded como fallback.
 */
export function recommendFoundation(
  skinTone: SkinToneResult,
  skinTonesFromCatalog?: SkinToneFromCatalog[]
): FoundationResult {
  const { undertone, depth, labValues } = skinTone;

  // Calculate foundation color from LAB values
  const foundationL = Math.max(10, Math.min(90, labValues.L));
  const foundationA = labValues.a * 0.8;
  const foundationB = labValues.b * 0.7;

  const [r, g, b] = labToRgb(foundationL, foundationA, foundationB);
  const colorHex = rgbToHex(r, g, b);

  // Try to find matching skin tone from catalog
  const match = skinTonesFromCatalog?.find(
    (t) => t.undertone.toLowerCase() === undertone.toLowerCase() && t.depth.toLowerCase() === depth.toLowerCase()
  );

  const colorName = match?.colorName || `Base ${undertone === 'Warm' ? 'Dourada' : undertone === 'Cool' ? 'Rosada' : 'Natural'} ${depth === 'Fair' ? 'Muito Clara' : depth === 'Light' ? 'Clara' : depth === 'Medium' ? 'Média' : depth === 'Tan' ? 'Morena' : 'Escura'}`;
  const description = match?.description || DEFAULT_DESCRIPTIONS[depth]?.[undertone] || 'Base recomendada para o seu tom de pele.';
  const tips = match?.tips?.length ? match.tips : (DEFAULT_TIPS[depth]?.[undertone] || DEFAULT_TIPS['Medium']['Neutral']);

  return {
    colorHex,
    colorName,
    undertone,
    depth,
    description,
    tips,
  };
}
