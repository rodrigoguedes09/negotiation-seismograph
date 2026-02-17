# Negotiation Seismograph - DeveloperWeek 2026 Hackathon Submission

## Elevator Pitch

Real-time conversation intelligence that shows you what you can't hear: who's dominating, when interruptions happen, and whether you're losing the deal before it's over.

---

## About the Project

### Inspiration

The idea came from a simple observation: most failed business negotiations don't fail because of bad products or pricing. They fail because of poor communication dynamics. Sales reps talk too much. Clients feel unheard. Subtle patterns of dominance, interruption, and uncertainty erode trust without anyone noticing until the deal is lost.

We've all been in conversations where something felt off, but we couldn't pinpoint what. That uncomfortable moment when someone keeps interrupting. The pitch that felt rushed. The client who seemed hesitant but we couldn't tell why. Traditional call analytics only work after the fact, when it's too late to adjust.

We wanted to build something that makes the invisible visible in real-time. Something that doesn't just transcribe what people say, but reveals how they say it and what that means for the outcome.

### What It Does

Negotiation Seismograph is a live conversation intelligence platform that analyzes business calls in real-time. While you're talking, it shows you:

**The Seismograph Line**: A live visualization of conversation health that rises and falls based on engagement quality. Green zones mean balanced, confident exchanges. Red zones signal problems: dominance imbalances, interruptions, hesitation.

**Six Real-Time Metrics**:
1. **Dominance Ratio**: Who's controlling the conversation and by what percentage
2. **Interruption Count**: Real-time alerts when speakers overlap
3. **Confidence Index**: Audio quality analysis combined with filler word detection
4. **Filler Word Tracking**: Counts "um", "uh", "like", and other hesitation markers
5. **Speaking Rate**: Identifies rushed or unnatural speech patterns
6. **Engagement Score**: Overall conversation quality predictor

**Live Transcript**: Shows exactly who said what, with speaker labels and timestamps.

**Smart Alerts**: Pop-up notifications when critical events happen - severe dominance, multiple interruptions, confidence drops.

**Post-Call Report**: After the conversation ends, you get actionable insights: who dominated, where interruptions clustered, confidence trends, and specific recommendations for improvement.

The magic is that it's all happening live. You can adjust your approach mid-conversation based on what the seismograph shows. If you're dominating, you can pause and ask questions. If confidence is dropping, you can slow down and clarify. It's like having a communication coach whispering in your ear during the call.

### How We Built It

**Architecture**: We built a real-time streaming pipeline connecting browser audio to Deepgram's Live API through a WebSocket server, with React visualizations on the frontend.

**Audio Capture**: The browser uses the MediaRecorder API to capture microphone audio. We process it with the Web Audio API, converting from Float32 to 16-bit PCM at 16kHz sample rate. This gives us the exact format Deepgram expects for optimal accuracy.

**Backend Server**: A Node.js WebSocket server acts as the bridge. It receives PCM audio chunks from the browser, forwards them to Deepgram's Live API, and processes the returning transcripts. The server maintains per-connection state, tracking metrics for each active conversation.

**Deepgram Integration**: We use the Deepgram SDK v3 with the Nova-2 model. The critical features:
- **Speaker Diarization**: Automatically identifies who's speaking, essential for dominance and interruption detection
- **Confidence Scores**: Provides per-word confidence ratings we use to detect uncertainty
- **Interim Results**: Gives us low-latency partial transcripts for near-instant visualization
- **Smart Formatting**: Handles punctuation and capitalization automatically

**Metrics Engine**: The server calculates six metrics in real-time:
- **Seismograph formula**: Combines balance, interruptions, speed, and confidence into a single 0-100 health score
- **Interruption detection**: Analyzes speech segment timestamps, flagging overlaps within 500ms
- **Filler word counting**: Regex-based pattern matching on transcript text
- **Confidence aggregation**: Weighted average of Deepgram's word-level confidence scores
- **Speaking statistics**: Tracks words per minute, total time, and per-speaker breakdowns

**Frontend Visualization**: React 18 with hooks for state management. Recharts handles the seismograph line chart with smooth animations. Framer Motion provides alert transitions. Tailwind CSS for rapid styling. Everything updates in real-time as WebSocket messages arrive.

**Technical Challenges**: Getting sub-second latency required careful optimization: WebSocket for low overhead, efficient PCM encoding in the browser, minimal processing between Deepgram and visualization. We keep all computation async and non-blocking.

### Challenges We Ran Into

**Audio Format Compatibility**: Deepgram expects specific audio formats. We spent significant time getting the browser's MediaRecorder output converted correctly to PCM. The Web Audio API's ScriptProcessorNode was deprecated, so we used the modern approach with AudioWorklet, but had to handle browser compatibility issues. Eventually we found a clean solution with Float32Array to Int16Array conversion that works across browsers.

**Speaker Diarization Accuracy**: Deepgram's diarization is excellent, but it's not instantaneous. Early in a conversation, it sometimes labels speakers inconsistently until it builds enough voice profile data. We handled this by implementing speaker merging logic and displaying speaker IDs clearly rather than trying to guess real names.

**Interruption Detection Logic**: Defining what counts as an "interruption" vs. natural turn-taking was tricky. We experimented with different time thresholds (100ms, 300ms, 500ms) and settled on 500ms as the sweet spot that catches real interruptions without flagging every natural overlap.

**Real-Time Metric Balance**: The seismograph formula needed extensive tuning. Too sensitive and it swings wildly. Not sensitive enough and it stays flat. We iterated through multiple formulas, testing with real conversation recordings, until we found weights that produce meaningful, responsive visualizations.

**WebSocket State Management**: Handling connection drops, reconnections, and multiple simultaneous conversations was complex. We implemented per-connection state tracking, cleanup on disconnect, and error recovery without losing conversation history.

**Browser Microphone Permissions**: Different browsers handle audio permissions differently. Chrome, Firefox, and Edge all have quirks. We added clear permission request handling and fallback messages when access is denied.

### Accomplishments That We're Proud Of

**It Actually Works in Real-Time**: This isn't a demo with fake data. Connect a microphone, start talking, and watch the metrics update instantly. The entire pipeline - audio capture, streaming, Deepgram processing, metrics calculation, visualization - happens in under 2 seconds end-to-end.

**The Seismograph Visualization**: The central chart isn't just eye candy. It's a genuinely useful interface that compresses complex multi-dimensional data into a single intuitive line. When we tested with real sales calls, people immediately understood what it was telling them.

**Six Distinct Analysis Categories**: We're not just transcribing. We're analyzing speaker dynamics (diarization), audio quality (confidence), temporal patterns (interruptions, rate), linguistic patterns (filler words), and overall engagement. That's a comprehensive analysis of conversation health.

**Production-Ready Code**: Clean architecture with separation of concerns. Proper error handling. Comprehensive debugging tools. Documentation for troubleshooting. This isn't prototype code - it's something you could actually deploy.

**Actionable Insights**: The post-call report doesn't just show numbers. It tells you what went well, what went wrong, and specific things to improve. "Speaker 1 dominated 73% of the conversation. Consider asking more open-ended questions to encourage client participation."

### What We Learned

**Audio Processing Is Hard**: Working with real-time audio in browsers taught us a lot about codec quirks, sample rates, bit depths, and the gap between Web Audio API documentation and reality. We learned to always test with real hardware, not just simulated audio.

**Real-Time Constraints Matter**: Every millisecond counts. We learned to profile WebSocket message sizes, optimize JSON payloads, and minimize processing between I/O operations. The difference between 500ms and 2000ms latency completely changes the user experience.

**Deepgram's API Is Powerful**: We only scratched the surface. The Nova-2 model's accuracy is impressive. Speaker diarization works remarkably well even with poor audio quality. The confidence scores are actually useful, not just noise. There's a lot more we could do with sentiment analysis and custom vocabulary.

**Metrics Need Context**: Raw numbers don't mean much. A 70/30 dominance split might be fine for a sales pitch, terrible for a negotiation, and expected for a coaching call. Good metrics need thresholds, context-aware alerts, and human interpretation.

**Visualization Drives Understanding**: We initially showed metrics as tables of numbers. Boring and unhelpful. The seismograph chart transformed the experience. People engage with visual feedback in ways they don't with raw data.

**Testing With Real Humans Is Essential**: Solo testing missed so many edge cases. Real conversations have crosstalk, background noise, accent variations, and unpredictable patterns. Every real test session revealed something we hadn't considered.

### What's Next for Negotiation Seismograph

**Sentiment Analysis**: Deepgram provides sentiment scores. We want to integrate emotional tone into the seismograph - detecting frustration, enthusiasm, agreement. This would add a crucial dimension to conversation health.

**Custom Vocabulary**: Different industries have domain-specific jargon and filler words. We want to let users configure custom word lists, so a healthcare company can track different patterns than a tech startup.

**Historical Analytics**: Build a database of past conversations. Track improvement over time. Compare your metrics against team averages. Identify your best and worst calls to learn from patterns.

**Live Coaching Prompts**: Instead of just alerts, provide specific suggestions during the call: "You've been speaking for 3 minutes. Try asking: 'What are your thoughts on this?'"

**Integration With CRMs**: Auto-sync call transcripts and metrics to Salesforce, HubSpot, etc. Correlation analysis: Which conversation patterns predict closed deals?

**Multi-Language Support**: Deepgram supports 30+ languages. We could expand beyond English, enabling global sales teams to use the platform.

**Topic Tracking**: Use keyword extraction to identify when the conversation shifts topics. Show a timeline of discussion points alongside the seismograph.

**Team Benchmarking**: Aggregate anonymized data across an organization. Show sales reps how their conversation patterns compare to top performers.

**Mobile Support**: Right now it's browser-only. A mobile app could analyze in-person meetings using phone microphones.

**AI-Generated Summaries**: Use LLMs to generate executive summaries of calls, pulling key quotes and decisions automatically.

The core insight - that conversation dynamics predict outcomes - has applications far beyond sales. Therapy sessions, mediations, customer support, job interviews, team meetings. Anywhere people talk, understanding how they talk matters. We've built the foundation. Now we can expand into dozens of use cases where better communication creates better outcomes.

---

## Built With

### Languages
- JavaScript (ES6+)
- Node.js
- HTML5
- CSS3

### Frameworks & Libraries
- **React 18** - Frontend UI framework
- **Express.js** - Backend web server
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Framer Motion** - Animation library
- **Lucide React** - Icon system

### APIs & Services
- **Deepgram API** - Speech-to-text and audio intelligence
  - Nova-2 model
  - Speaker diarization
  - Confidence scoring
  - Live streaming
  - Interim results
- **Deepgram SDK v3** - Official JavaScript client

### Audio Technologies
- **MediaRecorder API** - Browser audio capture
- **Web Audio API** - Audio processing and PCM conversion
- **WebSocket (ws)** - Real-time bidirectional communication

### Development Tools
- **npm** - Package management
- **dotenv** - Environment configuration
- **cors** - Cross-origin resource sharing
- **ESLint** - Code linting
- **Git** - Version control

### Cloud & Platform
- Local development environment
- Can deploy to:
  - Vercel (frontend)
  - Heroku/Railway (backend)
  - AWS/Azure/GCP (full stack)

### Key Technical Decisions

**Why WebSocket**: Lower latency than HTTP polling, perfect for real-time audio streaming

**Why React**: Component architecture maps well to our modular UI, hooks simplify state management

**Why Vite**: Fast dev server, optimized production builds, better than Create React App

**Why Deepgram**: Best-in-class accuracy, live streaming support, speaker diarization out of the box

**Why PCM 16kHz**: Industry standard for speech recognition, optimal quality/bandwidth tradeoff

**Why Node.js**: JavaScript end-to-end, async I/O perfect for WebSocket handling, huge package ecosystem
