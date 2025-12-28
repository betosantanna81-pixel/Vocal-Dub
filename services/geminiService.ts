
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData, audioBufferToWavBlob } from "../utils/audioUtils";
import { SpeechParams } from "../types";

const API_KEY = process.env.API_KEY || "";

const getIntensityLabel = (val: number, low: string, mid: string, high: string) => {
  if (val < 5) return `extremamente ${low}`;
  if (val < 9) return low;
  if (val < 12) return mid;
  if (val < 16) return high;
  return `extremamente ${high}`;
};

export const generateSpeech = async (
  text: string, 
  voiceName: string, 
  mood: string,
  params: SpeechParams
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Chave de API não encontrada. Verifique as configurações.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const speedDesc = getIntensityLabel(params.speed, 'lenta', 'normal', 'rápida');
  const pitchDesc = getIntensityLabel(params.pitch, 'grave e profunda', 'média', 'aguda e fina');
  const resonanceDesc = getIntensityLabel(params.resonance, 'opaca e aveludada', 'equilibrada', 'brilhante e metálica');
  const aspirationDesc = getIntensityLabel(params.aspiration, 'limpa e firme', 'suave', 'soprada com muito ar');
  const nasalityDesc = getIntensityLabel(params.nasality, 'oral e aberta', 'natural', 'anasalada');
  const prosodyDesc = getIntensityLabel(params.prosody, 'monótona e reta', 'natural', 'expressiva e variada');
  
  // Novos descritores v0.1.8
  const ageDesc = getIntensityLabel(params.age, 'infantil e jovem', 'jovem-adulta', 'madura e idosa');
  const textureDesc = getIntensityLabel(params.texture, 'áspera e rouca', 'limpa', 'sedosa e aveludada');
  const intensityDesc = getIntensityLabel(params.intensity, 'íntima e contida', 'natural', 'projetada e vibrante');

  const moodDesc = mood !== 'Neutral' ? ` no estilo ${mood.toLowerCase()}` : '';

  const instruction = `Gere uma voz com as seguintes características técnicas (Escala 0-20): 
    - Tom (Pitch): ${pitchDesc} (Valor: ${params.pitch})
    - Cadência (Velocidade): ${speedDesc} (Valor: ${params.speed})
    - Brilho (Timbre): ${resonanceDesc} (Valor: ${params.resonance})
    - Idade Vocal: ${ageDesc} (Valor: ${params.age})
    - Textura Vocal: ${textureDesc} (Valor: ${params.texture})
    - Projeção/Intensidade: ${intensityDesc} (Valor: ${params.intensity})
    - Aspiridade: ${aspirationDesc} (Valor: ${params.aspiration})
    - Nasalidade: ${nasalityDesc} (Valor: ${params.nasality})
    - Prosódia: ${prosodyDesc} (Valor: ${params.prosody})
    ${moodDesc}.
    
    Texto para falar: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: instruction }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("Nenhum dado de áudio foi retornado pela API.");
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const decodedBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
    
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    return URL.createObjectURL(wavBlob);
  } catch (error) {
    console.error("Erro na Geração TTS:", error);
    throw error;
  }
};
