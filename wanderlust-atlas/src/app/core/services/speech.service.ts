import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechService implements OnDestroy {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private chunks: string[] = [];
  private currentChunkIndex = 0;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  readonly isPlaying = signal<boolean>(false);
  readonly isPaused = signal<boolean>(false);

  constructor() {
    if (this.synth) {
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.synth?.getVoices();
      }
    }
  }

  speak(text: string, title?: string): void {
    if (!this.synth) return;

    // Reset current playback state
    this.stopQuietly();

    const formattedContent = this.formatStoryForReading(text, title);
    if (!formattedContent.trim()) return;

    // Split text into small sentence chunks (under 180 chars) for 100% mobile compatibility
    this.chunks = this.splitIntoChunks(formattedContent);
    this.currentChunkIndex = 0;

    if (this.chunks.length === 0) return;

    this.isPlaying.set(true);
    this.isPaused.set(false);

    this.speakNextChunk();
  }

  private speakNextChunk(): void {
    if (!this.synth || !this.isPlaying() || this.currentChunkIndex >= this.chunks.length) {
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.activeUtterance = null;
      return;
    }

    const chunkText = this.chunks[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = 'en-US';
    utterance.rate = 0.93;
    utterance.pitch = 1.12;

    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      const femaleVoice = this.getFemaleVoice(voices);
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
    }

    utterance.onend = () => {
      this.currentChunkIndex++;
      if (this.isPlaying() && !this.isPaused()) {
        this.speakNextChunk();
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis chunk error:', e);
      this.currentChunkIndex++;
      if (this.isPlaying() && !this.isPaused()) {
        this.speakNextChunk();
      } else {
        this.isPlaying.set(false);
        this.isPaused.set(false);
        this.activeUtterance = null;
      }
    };

    this.activeUtterance = utterance;
    if (this.synth.paused) {
      this.synth.resume();
    }
    this.synth.speak(utterance);
  }

  pause(): void {
    if (this.synth && this.isPlaying()) {
      this.synth.pause();
      this.isPaused.set(true);
    }
  }

  resume(): void {
    if (this.synth && this.isPaused()) {
      this.synth.resume();
      this.isPaused.set(false);
    }
  }

  stop(): void {
    this.stopQuietly();
    this.isPlaying.set(false);
    this.isPaused.set(false);
  }

  private stopQuietly(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.activeUtterance = null;
  }

  toggle(text: string, title?: string): void {
    if (this.isPlaying() && !this.isPaused()) {
      this.pause();
    } else if (this.isPlaying() && this.isPaused()) {
      this.resume();
    } else {
      this.speak(text, title);
    }
  }

  private splitIntoChunks(text: string): string[] {
    // Split on sentence boundaries, preserving punctuation
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const result: string[] = [];

    for (const sentence of sentences) {
      if (sentence.length <= 180) {
        result.push(sentence.trim());
      } else {
        // Split longer sentences by commas or spaces
        const subParts = sentence.split(/,\s+/);
        let temp = '';
        for (const part of subParts) {
          if ((temp + part).length > 180) {
            if (temp) result.push(temp.trim());
            temp = part + ', ';
          } else {
            temp += part + ', ';
          }
        }
        if (temp.trim()) result.push(temp.trim());
      }
    }
    return result.filter(c => c.length > 0);
  }

  private getFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const femaleTokens = [
      'ava (natural)', 'jenny (natural)', 'aria (natural)', 'emma (natural)', 'ana (natural)',
      'ava', 'jenny', 'aria', 'emma', 'samantha', 'zira', 'karen', 'victoria', 
      'moira', 'veena', 'fiona', 'google us english', 'female', 'siri'
    ];

    for (const token of femaleTokens) {
      const matched = englishVoices.find(v => v.name.toLowerCase().includes(token));
      if (matched) return matched;
    }

    return englishVoices[0];
  }

  private formatStoryForReading(text: string, title?: string): string {
    const raw = title ? `${title}. ${this.stripHtml(text)}` : this.stripHtml(text);
    return raw.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
