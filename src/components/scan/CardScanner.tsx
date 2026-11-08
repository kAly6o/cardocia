"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { calculateHashFromImage, compareHashes } from '@/lib/scan-utils';

interface HashResult {
  id: string;
  name: string;
  image_url: string;
  confidence: number;
}

interface DbEntry {
  id: string;
  name: string;
  image_url: string;
  hash: string;
}

export const CardScanner = () => {
  const [hasPhoto, setHasPhoto] = useState(false);
  const [candidates, setCandidates] = useState<HashResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const databaseRef = useRef<DbEntry[]>([]);

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const res = await fetch('/data/card-hashes.json');
        const data: DbEntry[] = await res.json();
        databaseRef.current = data;
      } catch {
        databaseRef.current = [];
        console.error('Erreur chargement base');
      }
    };
    loadDatabase();
  }, []);

  const startScanner = useCallback(async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert("Impossible d'accéder à la caméra. vérifie les permissions.");
      setIsScanning(false);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const dataURL = canvas.toDataURL('image/jpeg');
    const hashValue = await calculateHashFromImage(dataURL);

    const matches = databaseRef.current.length
      ? compareHashes(hashValue, databaseRef.current, 5)
      : [];

    setCandidates(matches);
    setHasPhoto(true);
    setIsScanning(false);

    if (video.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-ink mb-4">Scanner une carte Pokémon</h2>
      {isScanning && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg border border-line"
        />
      )}

      <Button
        disabled={isScanning}
        className="mb-2"
        onClick={startScanner}
      >
        {isScanning ? 'En cours...' : 'Accéder à la caméra'}
      </Button>

      <Button
        disabled={isScanning}
        className="mb-4"
        onClick={capturePhoto}
      >
        Prendre la photo
      </Button>

      {hasPhoto && candidates.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted">Cartes détectées :</h3>
          {candidates.map((c, i) => (
            <div
              key={i}
              className="border border-line rounded-lg p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- images distantes (TCGdex), next/image non configuré */}
              <img src={c.image_url} alt={c.name} width={80} className="block mx-auto" />
              <div className="text-center">
                <strong>{c.name}</strong> #{c.id.replace('pkmn-', '')}
                <br />
                <span className="text-xs text-green-600">
                  {Math.round(c.confidence * 100)}% de correspondance
                </span>
              </div>
              <Button
                className="w-full mt-2"
                onClick={() => router.push(`/collection/carte/${c.id}`)}
              >
                Ajouter à ma collection
              </Button>
            </div>
          ))}
          {candidates.length < 5 && (
            <p className="text-sm text-muted">Aucune correspondance certaine. Essaie une autre photo.</p>
          )}
        </div>
      )}
      {hasPhoto && candidates.length === 0 && (
        <p className="text-sm text-muted">Aucune carte reconnue. Essaie une autre photo.</p>
      )}
    </div>
  );
};
