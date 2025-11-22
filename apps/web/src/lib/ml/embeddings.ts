/**
 * Multi-Modal Embeddings Extraction
 *
 * TypeScript bridge to Python ML models for extracting embeddings:
 * - CLIP (ViT-B/32) for image embeddings (512-dim)
 * - Wav2Vec2 for audio embeddings (768-dim)
 *
 * These embeddings enable RAG-based retrieval for video generation.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Extract CLIP embedding from an image
 *
 * Uses OpenAI's CLIP ViT-B/32 model to generate 512-dimensional
 * embeddings that capture semantic visual features.
 *
 * Note: In production, this should be replaced with a proper Python
 * service (Flask/FastAPI) or ML inference service (e.g., Replicate, HuggingFace Inference).
 *
 * @param imagePath - Absolute path to image file
 * @returns 768-dimensional embedding vector (padded from 512)
 */
export async function extractImageEmbedding(imagePath: string): Promise<number[]> {
  try {
    // Verify file exists
    await fs.access(imagePath);

    // Call Python script to extract CLIP embedding
    const { stdout, stderr } = await execAsync(
      `python3 -c "
import sys
import json
try:
    from PIL import Image
    import torch
    from transformers import CLIPProcessor, CLIPModel

    # Load CLIP model
    model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32')
    processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')

    # Load and process image
    image = Image.open('${imagePath}')
    inputs = processor(images=image, return_tensors='pt')

    # Extract image features
    with torch.no_grad():
        embeddings = model.get_image_features(**inputs)

    # Convert to list and pad to 768 dimensions
    embedding = embeddings[0].tolist()

    # Pad from 512 to 768 with zeros
    while len(embedding) < 768:
        embedding.append(0.0)

    # Output as JSON
    print(json.dumps(embedding[:768]))

except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large embeddings
    );

    if (stderr && stderr.includes('error')) {
      throw new Error(`Python error: ${stderr}`);
    }

    const embedding = JSON.parse(stdout.trim());

    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error('Invalid embedding format');
    }

    return embedding;
  } catch (error) {
    console.error('[EXTRACT_IMAGE_EMBEDDING_ERROR]', error);
    throw new Error(`Failed to extract image embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract Wav2Vec2 embedding from audio
 *
 * Uses Facebook's Wav2Vec2 model to generate 768-dimensional
 * embeddings that capture voice characteristics.
 *
 * Note: In production, this should be replaced with a proper Python
 * service or ML inference service.
 *
 * @param audioPath - Absolute path to audio file (wav, mp3, etc.)
 * @returns 768-dimensional embedding vector
 */
export async function extractAudioEmbedding(audioPath: string): Promise<number[]> {
  try {
    // Verify file exists
    await fs.access(audioPath);

    // Call Python script to extract Wav2Vec2 embedding
    const { stdout, stderr } = await execAsync(
      `python3 -c "
import sys
import json
try:
    import torch
    from transformers import Wav2Vec2Processor, Wav2Vec2Model
    import librosa

    # Load Wav2Vec2 model
    model = Wav2Vec2Model.from_pretrained('facebook/wav2vec2-base')
    processor = Wav2Vec2Processor.from_pretrained('facebook/wav2vec2-base')

    # Load audio file (resample to 16kHz)
    waveform, rate = librosa.load('${audioPath}', sr=16000)

    # Process audio
    inputs = processor(waveform, return_tensors='pt', sampling_rate=16000)

    # Extract audio features
    with torch.no_grad():
        outputs = model(**inputs)
        # Use mean pooling over time dimension
        embeddings = outputs.last_hidden_state.mean(dim=1)

    # Convert to list
    embedding = embeddings[0].tolist()

    # Ensure 768 dimensions
    if len(embedding) != 768:
        raise ValueError(f'Expected 768 dimensions, got {len(embedding)}')

    # Output as JSON
    print(json.dumps(embedding))

except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    if (stderr && stderr.includes('error')) {
      throw new Error(`Python error: ${stderr}`);
    }

    const embedding = JSON.parse(stdout.trim());

    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error('Invalid embedding format');
    }

    return embedding;
  } catch (error) {
    console.error('[EXTRACT_AUDIO_EMBEDDING_ERROR]', error);
    throw new Error(`Failed to extract audio embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch extract embeddings from multiple files
 *
 * More efficient than calling extractImageEmbedding/extractAudioEmbedding
 * individually when processing many files.
 *
 * @param files - Array of { path: string, type: 'image' | 'audio' }
 * @returns Array of embeddings in the same order
 */
export async function batchExtractEmbeddings(
  files: Array<{ path: string; type: 'image' | 'audio' }>
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const file of files) {
    try {
      const embedding =
        file.type === 'image'
          ? await extractImageEmbedding(file.path)
          : await extractAudioEmbedding(file.path);
      embeddings.push(embedding);
    } catch (error) {
      console.error(`Failed to extract embedding for ${file.path}:`, error);
      // Push zero vector on error
      embeddings.push(new Array(768).fill(0));
    }
  }

  return embeddings;
}

/**
 * Check if Python ML dependencies are installed
 *
 * Validates that required Python packages are available:
 * - torch
 * - transformers
 * - PIL (Pillow)
 * - librosa
 *
 * @returns Object with installation status and missing packages
 */
export async function checkMLDependencies(): Promise<{
  installed: boolean;
  missing: string[];
  versions: Record<string, string>;
}> {
  try {
    const { stdout } = await execAsync(`python3 -c "
import sys
import json
missing = []
versions = {}

try:
    import torch
    versions['torch'] = torch.__version__
except:
    missing.append('torch')

try:
    import transformers
    versions['transformers'] = transformers.__version__
except:
    missing.append('transformers')

try:
    from PIL import Image
    import PIL
    versions['pillow'] = PIL.__version__
except:
    missing.append('pillow')

try:
    import librosa
    versions['librosa'] = librosa.__version__
except:
    missing.append('librosa')

print(json.dumps({'missing': missing, 'versions': versions}))
"`);

    const result = JSON.parse(stdout.trim());
    return {
      installed: result.missing.length === 0,
      missing: result.missing,
      versions: result.versions,
    };
  } catch (error) {
    console.error('[CHECK_ML_DEPENDENCIES_ERROR]', error);
    return {
      installed: false,
      missing: ['python3', 'torch', 'transformers', 'pillow', 'librosa'],
      versions: {},
    };
  }
}
