// API endpoint for connectivity check
export default function handler(req, res) {
  // Simple ping response to verify real connectivity
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
