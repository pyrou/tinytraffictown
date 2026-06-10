export class AudioManager {
  private bgMusic: HTMLAudioElement | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;

  constructor() {
    this.bgMusic = new Audio("./theme.mp3");
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.3;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (this.bgMusic) {
      if (enabled && this.bgMusic.paused) {
        this.bgMusic.play().catch(() => {});
      } else if (!enabled && !this.bgMusic.paused) {
        this.bgMusic.pause();
      }
    }
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
  }

  playBackgroundMusic(): void {
    if (this.musicEnabled && this.bgMusic && this.bgMusic.paused) {
      this.bgMusic.play().catch(() => {});
    }
  }

  stopBackgroundMusic(): void {
    if (this.bgMusic && !this.bgMusic.paused) {
      this.bgMusic.pause();
    }
  }

  playBuildingSound(): void {
    if (this.sfxEnabled) {
      const audio = new Audio("./building.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }
}
