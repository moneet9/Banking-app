import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { runBankingAgent } from '../agents/bankingAgent.js';
import { runMultiAgentSystem } from '../agents/multiAgentSystem.js';

const router = express.Router();

// Limit each authenticated user to 30 agent requests per minute to prevent
// abuse of potentially expensive LLM API calls.
const agentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

router.use(agentLimiter);
router.use(requireAuth);
router.use(requireRole('customer'));

/**
 * POST /api/agent/chat
 *
 * Single-agent chatbot endpoint.
 * Body: { message: string }
 *
 * Demonstrates:
 *   PERCEPTION  — agent reads `message` and the authenticated user context
 *   DECISION    — agent identifies the intent (balance / transactions / loans / spending)
 *   ACTION      — agent fetches live data from MongoDB and returns a reply
 */
router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'message is required' });
  }

  const result = await runBankingAgent(message.trim(), req.user);
  return res.json({ success: true, data: result });
});

/**
 * POST /api/agent/multi-chat
 *
 * Multi-agent system endpoint.
 * Body: { message: string }
 *
 * Two agents communicate:
 *   Agent 1 (Customer Interface Agent) — receives user message, delegates to Agent 2
 *   Agent 2 (Banking Operations Agent) — fetches live banking data, returns it to Agent 1
 *   Agent 1 — synthesises Agent 2's response into a customer-friendly reply
 *
 * The agentTrace field in the response shows the inter-agent communication log.
 */
router.post('/multi-chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'message is required' });
  }

  const result = await runMultiAgentSystem(message.trim(), req.user);
  return res.json({ success: true, data: result });
});

export default router;
