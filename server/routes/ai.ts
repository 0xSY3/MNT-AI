import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System message to provide context about Mantle Network
const SYSTEM_MESSAGE = `You are MNT AI, an AI assistant specialized in the Mantle Network ecosystem. You help users understand:

1. Mantle Network's Layer 2 scaling solution
2. Smart contract development on Mantle
3. Network features and capabilities
4. Performance metrics and statistics
5. Best practices for building on Mantle

Keep responses concise, technical but approachable, and always accurate. If uncertain, admit limitations.`;

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const reply = completion.choices[0].message.content;
    res.json({ message: reply });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

export default router;
