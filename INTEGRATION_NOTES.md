# med-assistant-pro v2 Integration Notes

## Overview

This document describes the integration of AI capabilities from `med-assistant-pro-v2` into `med-assistant-pro`, while maintaining Vercel deployment compatibility and ensuring no third-party advertisements.

## Changes Made

### 1. LLM Module Integration (`server/llm.ts`)

**New File**: `server/llm.ts`
- Extracted LLM invocation logic from med-assistant-pro-v2
- Supports Gemini 2.5 Flash model via Manus Forge API
- Provides fallback to static knowledge base when LLM is unavailable
- Fully typed with TypeScript for type safety
- Vercel Serverless compatible (no persistent connections)

**Key Features**:
- Message normalization for OpenAI-compatible APIs
- Support for tool calls and structured output schemas
- Graceful degradation to fallback analysis
- Environment variable flexibility (BUILT_IN_FORGE_API_KEY or OPENAI_API_KEY)

### 2. Enhanced API Handler (`api/index.ts`)

**Updated File**: `api/index.ts`
- Integrated LLM-based medication analysis
- Maintains backward compatibility with existing endpoints
- `/api/analyze-medication` now uses LLM with intelligent fallback
- Async handler support for Vercel Functions

**New Capability**:
```typescript
// Before: Static database lookup only
// After: LLM analysis with fallback to static DB
async function analyzeMedicationWithLLM(
  medications: string[],
  ageGroup: string
): Promise<Record<string, unknown>>
```

### 3. Dependencies Update (`package.json`)

**Added**:
- `dotenv`: ^17.2.2 (for environment variable loading)

**No Breaking Changes**: All existing dependencies remain compatible.

### 4. Environment Configuration

**New File**: `.env.example`
```
BUILT_IN_FORGE_API_KEY=your_key_here
NODE_ENV=production
```

**Supported Variables**:
- `BUILT_IN_FORGE_API_KEY`: Manus Forge API key (recommended)
- `OPENAI_API_KEY`: OpenAI API key (fallback)
- `BUILT_IN_FORGE_API_URL`: Custom Forge API endpoint (optional)

## Architecture Decisions

### Why Vercel Compatibility Matters

1. **Serverless Functions**: API handlers run as stateless functions
2. **No Persistent Connections**: LLM calls use fetch API (not WebSocket)
3. **Cold Start Optimization**: Minimal initialization overhead
4. **Cost Efficiency**: Pay only for execution time

### Why Fallback Mechanism

1. **Reliability**: Service continues without LLM API
2. **Cost Control**: Can disable LLM for cost-sensitive deployments
3. **Offline Support**: Works with static knowledge base only
4. **Graceful Degradation**: Users get results even if LLM fails

## Deployment Instructions

### Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Vercel Deployment

1. **Set Environment Variables** in Vercel Project Settings:
   ```
   BUILT_IN_FORGE_API_KEY=your_key_here
   NODE_ENV=production
   ```

2. **Deploy**:
   ```bash
   vercel deploy
   ```

3. **Verify**:
   ```bash
   curl https://your-project.vercel.app/api/health
   ```

## Testing the Integration

### Test Medication Analysis with LLM

```bash
curl -X POST https://your-project.vercel.app/api/analyze-medication \
  -H "Content-Type: application/json" \
  -d '{
    "medications": ["aspirin", "ibuprofen"],
    "ageGroup": "adult"
  }'
```

### Expected Response

```json
{
  "success": true,
  "analysis": {
    "text": "Detailed AI analysis of medications..."
  },
  "usedLLM": true
}
```

### Fallback Response (when LLM unavailable)

```json
{
  "success": true,
  "riskLevel": "高",
  "interactions": ["aspirin 與 ibuprofen 可能存在交互作用"],
  "medDetails": [...],
  "usedFallback": true
}
```

## Security & Privacy

### No Third-Party Advertisements

✅ **Verified**:
- No ad networks (Google AdSense, Facebook Ads, etc.)
- No tracking pixels or analytics (except Vercel built-in)
- No external scripts except Manus Forge API
- No data sharing with third parties

### Data Handling

- Medication queries are sent to Manus Forge API only
- No persistent storage of user queries
- No cookies or local storage for tracking
- CORS headers properly configured

## Compatibility Matrix

| Feature | med-assistant-pro | med-assistant-pro-v2 | Integration Status |
|---------|-------------------|----------------------|-------------------|
| Medication Analysis | Static DB | LLM + DB | ✅ LLM with fallback |
| Symptom Checker | Basic | Advanced | ✅ LLM-enhanced |
| Scan Analysis | OCR mock | LLM-based | ✅ LLM support |
| Medical Facilities | Static | Database | ✅ Preserved |
| User Auth | Password | OAuth + JWT | ✅ Backward compatible |
| Vercel Deploy | ✅ | ❌ | ✅ Optimized |

## Troubleshooting

### Issue: "OPENAI_API_KEY is not configured"

**Solution**: Set `BUILT_IN_FORGE_API_KEY` or `OPENAI_API_KEY` environment variable.

### Issue: LLM requests timeout

**Solution**: Increase Vercel function timeout in `vercel.json`:
```json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 60
    }
  }
}
```

### Issue: Fallback analysis not working

**Solution**: Check that `server/llm.ts` is properly imported and `getFallbackAnalysis` function is available.

## Future Enhancements

1. **Database Integration**: Add MySQL support for user preferences
2. **Advanced Symptom Matching**: Implement vector similarity for symptom queries
3. **Real-time Medical Facilities**: Integrate with actual location APIs
4. **Multi-language Support**: Add English and other language support
5. **Caching Layer**: Implement Redis for frequently analyzed medications

## Migration Notes

### For Existing Users

- No breaking changes to API endpoints
- Existing static database still available as fallback
- LLM features are additive, not replacements

### For Developers

- Import `invokeLLM` from `server/llm.ts` for custom LLM calls
- Use `getFallbackAnalysis` for offline scenarios
- All types are exported from `server/llm.ts`

## References

- [Manus Forge API Documentation](https://forge.manus.im)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
