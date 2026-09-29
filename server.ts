import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { generateKeywordFallbackSchema } from './src/utils/keywordTemplates';
import { generateCopilotFallbackPatch } from './src/utils/copilotFallback';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side endpoint: POST /api/generate-schema
app.post('/api/generate-schema', async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'A valid text prompt is required.' });
  }

  const cleanPrompt = prompt.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out')), 4000)
      );

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert synthetic data and database architect. Generate a realistic schema based on the following user request: "${cleanPrompt}".
Determine whether the user is asking for a single Tabular dataset or a multi-table Relational database.
If counts are specified (e.g. "1000 customers and 5000 orders"), assign them appropriately.
Supported column types: integer, float, string, boolean, date, category, uuid, email, full name, phone, address, company.
Always return strict JSON conforming to the requested schema.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mode: { type: Type.STRING, description: 'Either "tabular" or "relational"' },
              summary: { type: Type.STRING, description: 'Brief summary of the designed schema' },
              rowCount: { type: Type.NUMBER, description: 'Default rows for tabular mode' },
              tabularColumns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    nullPercentage: { type: Type.NUMBER },
                    isUnique: { type: Type.BOOLEAN },
                    min: { type: Type.NUMBER },
                    max: { type: Type.NUMBER },
                    precision: { type: Type.NUMBER },
                    minDate: { type: Type.STRING },
                    maxDate: { type: Type.STRING },
                  },
                  required: ['id', 'name', 'type', 'nullPercentage', 'isUnique'],
                },
              },
              relationalTables: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    primaryKey: { type: Type.STRING },
                    rowCount: { type: Type.NUMBER },
                    columns: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          nullPercentage: { type: Type.NUMBER },
                          isUnique: { type: Type.BOOLEAN },
                          min: { type: Type.NUMBER },
                          max: { type: Type.NUMBER },
                        },
                        required: ['id', 'name', 'type', 'nullPercentage', 'isUnique'],
                      },
                    },
                    foreignKeys: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          column: { type: Type.STRING },
                          targetTable: { type: Type.STRING },
                          targetColumn: { type: Type.STRING },
                          cardinality: { type: Type.STRING },
                        },
                        required: ['id', 'column', 'targetTable', 'targetColumn', 'cardinality'],
                      },
                    },
                  },
                  required: ['id', 'name', 'description', 'primaryKey', 'columns'],
                },
              },
            },
            required: ['mode', 'summary'],
          },
        },
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (
          (parsed.mode === 'tabular' && Array.isArray(parsed.tabularColumns) && parsed.tabularColumns.length > 0) ||
          (parsed.mode === 'relational' && Array.isArray(parsed.relationalTables) && parsed.relationalTables.length > 0)
        ) {
          return res.json({
            success: true,
            source: 'gemini',
            data: parsed,
          });
        }
      }
    } catch (err: any) {
      console.warn('Gemini schema generation failed, using intelligent template fallback:', err?.message || err);
    }
  }

  // Fallback to intelligent keyword-based schema
  const fallbackData = generateKeywordFallbackSchema(cleanPrompt);
  return res.json({
    success: true,
    source: 'fallback',
    data: fallbackData,
  });
});

// Server-side endpoint: POST /api/copilot
app.post('/api/copilot', async (req: Request, res: Response) => {
  const { prompt, currentColumns = [], currentSettings = {} } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'A valid text prompt is required.' });
  }

  const cleanPrompt = prompt.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out')), 4000)
      );

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert synthetic data schema copilot. The user wants to modify their data schema based on this instruction: "${cleanPrompt}".
Current columns: ${JSON.stringify(currentColumns.map((c: any) => ({ id: c.id, name: c.name, type: c.type, privacy: c.privacy })))}
Current settings: ${JSON.stringify({ rowCount: currentSettings.rowCount, anonymizePII: currentSettings.anonymizePII, injectEdgeCases: currentSettings.injectEdgeCases })}

Propose a series of precise JSON schema patches.
Actions can be:
- "add_column": supply complete column object with id, name, type (one of: integer, float, string, boolean, date, category, uuid, email, full name, phone, address, company), nullPercentage, isUnique, min, max, privacy ('none'|'mask'|'hash'), laplaceEpsilon.
- "modify_column": supply target columnId and partial column fields to update (e.g. privacy: 'mask', laplaceEpsilon: 1.5, nullPercentage: 10).
- "remove_column": supply target columnId.
- "update_settings": supply partial settings object (e.g. rowCount, injectEdgeCases, edgeCaseIntensity, anonymizePII).

Provide an explanation for each patch and a concise executive summary. Return strict JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: 'Executive summary of the proposed schema modifications' },
              patches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: 'One of add_column, modify_column, remove_column, update_settings' },
                    columnId: { type: Type.STRING },
                    column: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        nullPercentage: { type: Type.NUMBER },
                        isUnique: { type: Type.BOOLEAN },
                        min: { type: Type.NUMBER },
                        max: { type: Type.NUMBER },
                        precision: { type: Type.NUMBER },
                        privacy: { type: Type.STRING },
                        laplaceEpsilon: { type: Type.NUMBER },
                      },
                    },
                    settings: {
                      type: Type.OBJECT,
                      properties: {
                        rowCount: { type: Type.NUMBER },
                        anonymizePII: { type: Type.BOOLEAN },
                        injectEdgeCases: { type: Type.BOOLEAN },
                        edgeCaseIntensity: { type: Type.STRING },
                      },
                    },
                    explanation: { type: Type.STRING, description: 'Clear reason for this patch' },
                  },
                  required: ['action', 'explanation'],
                },
              },
            },
            required: ['summary', 'patches'],
          },
        },
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);
      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.patches) && parsed.patches.length > 0) {
          return res.json({
            success: true,
            source: 'gemini',
            data: parsed,
          });
        }
      }
    } catch (err: any) {
      console.warn('Gemini Copilot patch failed, using fallback:', err?.message || err);
    }
  }

  // Fallback to keyword-based copilot patch
  const fallback = generateCopilotFallbackPatch(cleanPrompt, currentColumns, currentSettings);
  return res.json({
    success: true,
    source: 'fallback',
    data: fallback,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SynthForge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
