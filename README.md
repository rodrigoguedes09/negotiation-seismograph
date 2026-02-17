# Negotiation Seismograph

Real-time conversation intelligence that reveals the hidden dynamics of business negotiations. Built with Deepgram's Audio Intelligence APIs for the DeveloperWeek 2026 Hackathon.

## Overview

Negotiation Seismograph analyzes live conversations and provides instant feedback on conversation health, speaker dominance, interruption patterns, and confidence levels. The system processes audio streams in real-time and visualizes engagement quality as a live seismograph chart.

## What It Does

The platform monitors conversations and tracks:

- **Conversation Health**: A live seismograph line showing overall engagement quality
- **Dominance Ratio**: Percentage breakdown of speaking time between participants
- **Interruption Detection**: Real-time alerts when speakers overlap
- **Confidence Analysis**: Detects hesitation through audio quality and filler word frequency
- **Speaking Rate**: Monitors pace to identify rushed or unnatural speech patterns
- **Engagement Scoring**: Combines all metrics into an actionable post-call report

## Quick Start

### Prerequisites
- Node.js 18 or higher
- Modern browser with microphone access
- Deepgram API key

### Installation

```bash
# Install dependencies
npm run install-all

# Configure environment
cp .env.example .env
# Add your Deepgram API key to .env

# Start the application
npm run dev
```

Access the app at `http://localhost:5173`

### Alternative: Manual Start

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

## How It Works

### Architecture

```
Browser Microphone
    ↓
MediaRecorder API (PCM 16kHz)
    ↓
WebSocket Connection
    ↓
Node.js Server
    ↓
Deepgram Live API (Nova-2)
    ↓
Real-time Transcription + Diarization
    ↓
Metrics Calculation Engine
    ↓
WebSocket Push to Frontend
    ↓
React Dashboard Visualization
```

### Audio Processing Pipeline

1. Browser captures microphone audio using MediaRecorder API
2. Audio is converted from Float32 to Int16 PCM at 16kHz
3. PCM data streams through WebSocket to the backend server
4. Server forwards audio to Deepgram's Live API with diarization enabled
5. Deepgram returns real-time transcripts with speaker labels and confidence scores
6. Backend calculates six metrics based on transcript data
7. Metrics stream back to the frontend for live visualization

### Metrics Calculation

**Seismograph Value** (0-100 scale):
```
Health = 50 + (balance × 10) - (interruptions × 20) - (speed_penalty × 10) + (confidence × 15)
```

**Dominance Ratio**:
```
Speaker Ratio = (Speaker Time / Total Time) × 100
```

**Interruption Detection**: Identifies when speech segments overlap within 500ms

**Confidence Index**: Combines Deepgram's audio confidence scores with filler word frequency

**Filler Word Analysis**: Counts instances of "um", "uh", "like", "you know", "sort of", "kind of"

**Engagement Score**: Weighted combination of all metrics for overall call quality

## Key Features

### Real-Time Analysis
- Sub-second latency between speech and visualization
- Live transcript with speaker identification
- Dynamic metrics updating as the conversation progresses

### Speaker Diarization
- Automatic detection of multiple speakers
- Per-speaker statistics (talk time, word count, confidence)
- Visual differentiation in transcript panel

### Visual Alerts
- Pop-up notifications for critical events
- Interruption warnings
- Dominance imbalance alerts
- Low confidence notifications

### Post-Call Report
- Comprehensive conversation summary
- Per-speaker breakdown
- Key insights and recommendations
- Downloadable results

## Technology Stack

### Backend
- Node.js with Express
- WebSocket server (ws library)
- Deepgram SDK v3
- Real-time audio streaming

### Frontend
- React 18 with Hooks
- Vite for build tooling
- Tailwind CSS for styling
- Recharts for data visualization
- Framer Motion for animations

### Audio Processing
- MediaRecorder API (browser native)
- Web Audio API for PCM conversion
- 16-bit PCM encoding at 16kHz sample rate

### Deepgram Features
- Nova-2 model for high accuracy
- Speaker diarization
- Confidence scoring
- Smart formatting
- Interim results
- Custom endpointing

## Project Structure

```
negotiation-seismograph/
├── server/
│   └── index.js              # WebSocket server + Deepgram integration
├── client/
│   ├── src/
│   │   ├── App.jsx           # Main application logic
│   │   └── components/
│   │       ├── Seismograph.jsx      # Live chart visualization
│   │       ├── MetricsPanel.jsx     # Real-time metrics display
│   │       ├── TranscriptPanel.jsx  # Live transcript with speakers
│   │       ├── AlertsPanel.jsx      # Notification system
│   │       └── FinalReport.jsx      # Post-call analysis
│   └── package.json
├── package.json
├── .env.example
└── README.md
```

## Testing the Application

### Solo Testing (Single Speaker)

The application works with a single speaker, though some features are optimized for multiple speakers:

**Working Features**:
- Live transcription
- Filler word detection
- Confidence analysis
- Speaking rate monitoring
- Seismograph visualization

**Limited Features**:
- Speaker diarization (will show single speaker)
- Dominance ratio (will show 100/0)

### Multi-Speaker Testing

For full feature demonstration, you can:
- Use different voice pitches (normal voice vs. falsetto)
- Play recorded audio from another device
- Test with a colleague on a video call

### Demo Scenarios

**Scenario 1: Aggressive Negotiator**
- Speak rapidly without pauses
- Dominate conversation time
- Use interrupting speech patterns
- Result: Red/yellow seismograph zones, alerts triggered

**Scenario 2: Balanced Conversation**
- Natural speaking pace
- Equal participation
- Clear articulation
- Result: Healthy green seismograph, high engagement score

**Scenario 3: Uncertain Speaker**
- Heavy use of filler words
- Hesitant delivery
- Long pauses
- Result: Low confidence scores, yellow warnings

## Use Cases

### Sales Training
- Identify aggressive sales tactics that push clients away
- Monitor talk-to-listen ratios during pitches
- Improve confidence through delivery feedback

### Customer Support
- Ensure balanced conversations with customers
- Detect service rep frustration or uncertainty
- Monitor call quality metrics

### Negotiation Coaching
- Analyze power dynamics in real-time
- Train for balanced communication
- Review post-call analytics for improvement

### Interview Preparation
- Practice confident delivery
- Reduce filler word usage
- Balance speaking time with interviewer

## API Configuration

The application requires a Deepgram API key with access to:
- Nova-2 model
- Speaker diarization
- Confidence scores
- Live streaming

Set your API key in `.env`:
```
DEEPGRAM_API_KEY=your_key_here
```

## Development

### Running Tests
```bash
# Backend
npm test

# Frontend
cd client
npm test
```

### Building for Production
```bash
# Frontend build
cd client
npm run build

# Serve production build
npm run preview
```

## License

MIT License - Built for DeveloperWeek 2026 Hackathon
