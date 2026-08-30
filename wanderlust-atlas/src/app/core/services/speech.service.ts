import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechService implements OnDestroy {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

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

    // Stop any active speech
    this.stop();

    const formattedContent = this.formatStoryForReading(text, title);
    if (!formattedContent.trim()) return;

    const utterance = new SpeechSynthesisUtterance(formattedContent);
    utterance.lang = 'en-US';
    
    // Clear, youthful & realistic tone settings
    utterance.rate = 0.93;  // Articulate, clear narrator pace
    utterance.pitch = 1.15; // Bright, youthful, realistic female voice pitch

    // Select young female narrator voice across browsers/OS
    const voices = this.synth.getVoices();
    const femaleVoice = this.getFemaleVoice(voices);
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      this.isPlaying.set(true);
      this.isPaused.set(false);
    };

    utterance.onend = () => {
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.currentUtterance = null;
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;

    // Chrome audio context resume fix
    if (this.synth.paused) {
      this.synth.resume();
    }
    this.synth.speak(utterance);
    this.synth.resume();
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
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying.set(false);
      this.isPaused.set(false);
      this.currentUtterance = null;
    }
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

  private getFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    
    // Priority order for young, realistic female voices (Edge Natural, Chrome, Safari, Windows, Android)
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
    const raw = title ? `${title}. ... ${this.stripHtml(text)}` : this.stripHtml(text);
    
    // Expressive storytelling pauses after punctuation marks and paragraphs
    return raw
      .replace(/([.!?])\s+/g, '$1 ... ')
      .replace(/,\s+/g, ', .. ')
      .replace(/\n+/g, ' ... ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
