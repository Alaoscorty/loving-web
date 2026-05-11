
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage } from '@/firebase';
import { confirmQrScan, uploadSelfieProof } from '@/lib/firebase-actions';
import type { Rendezvous } from '@/types/rendezvous';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Camera, CheckCircle, Upload, MapPin } from 'lucide-react';

type Step = 'requesting_permission' | 'scan_qr' | 'take_selfie' | 'preview_selfie' | 'uploading' | 'complete';

type Props = {
  rendezvous: Rendezvous & { id: string };
  onFlowComplete: () => void;
};

export function RendezvousConfirmationFlow({ rendezvous, onFlowComplete }: Props) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();

  const [step, setStep] = useState<Step>('requesting_permission');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getCameraPermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("La caméra n'est pas supportée par ce navigateur.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Get location
      if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((pos) => {
              setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
      }

      if (rendezvous.qrCodeScanned) {
        setStep('take_selfie');
      } else {
        setStep('scan_qr');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setStep('requesting_permission');
      toast({
        variant: 'destructive',
        title: 'Accès caméra refusé',
        description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
      });
    }
  }, [toast, rendezvous.qrCodeScanned]);

  useEffect(() => {
    if (step === 'requesting_permission') {
      getCameraPermission();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, getCameraPermission]);


  const handleSimulateScan = async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      await confirmQrScan({ 
          firestore, 
          rendezvousId: rendezvous.id,
          location: coords || undefined
      });
      toast({ title: 'QR Code scanné !', description: 'Géolocalisation enregistrée. Passez au selfie.' });
      setStep('take_selfie');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Impossible de confirmer le scan.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            setSelfieBlob(blob);
            setSelfiePreview(URL.createObjectURL(blob));
            setStep('preview_selfie');
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleUploadSelfie = async () => {
    if (!selfieBlob || !firestore || !storage) return;
    setIsLoading(true);
    setStep('uploading');
    try {
      await uploadSelfieProof({ firestore, storage, rendezvousId: rendezvous.id, selfieFile: selfieBlob });
      toast({ title: 'Selfie envoyé !', description: 'La preuve a été envoyée pour validation par un administrateur.' });
      setStep('complete');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Impossible d\'envoyer le selfie.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'requesting_permission':
        return (
          <div className="text-center">
            {hasCameraPermission === null && <p>Demande d'accès à la caméra...</p>}
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTitle>Accès à la caméra requis</AlertTitle>
                <AlertDescription>
                  Pour confirmer le rendez-vous, vous devez autoriser l'accès à la caméra.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'scan_qr':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Étape 1: Scanner le QR Code</DialogTitle>
              <DialogDescription>Visez le QR code présenté par l'homme avec votre caméra.</DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-md aspect-video w-full flex items-center justify-center my-4 overflow-hidden relative">
                <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                {coords && (
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Position capturée
                    </div>
                )}
            </div>
            <DialogFooter>
              <Button onClick={handleSimulateScan} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <Camera className="mr-2" />}
                Confirmer le scan du QR Code
              </Button>
            </DialogFooter>
          </>
        );

      case 'take_selfie':
         return (
          <>
            <DialogHeader>
              <DialogTitle>Étape 2: Le Selfie</DialogTitle>
              <DialogDescription>Prenez un selfie avec l'autre personne pour valider le rendez-vous.</DialogDescription>
            </DialogHeader>
             <div className="bg-muted rounded-md aspect-video w-full flex items-center justify-center my-4 overflow-hidden">
                <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
            </div>
            <DialogFooter>
              <Button onClick={handleTakePicture} className="w-full">
                <Camera className="mr-2" />
                Prendre la photo
              </Button>
            </DialogFooter>
          </>
        );
      
      case 'preview_selfie':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Aperçu du Selfie</DialogTitle>
              <DialogDescription>Si la photo vous convient, envoyez-la pour validation.</DialogDescription>
            </DialogHeader>
            {selfiePreview && <div className="relative aspect-[4/3] w-full"><Image src={selfiePreview} alt="Aperçu du selfie" fill className="rounded-md object-cover" /></div>}
            <DialogFooter className='pt-4 sm:justify-between gap-2'>
              <Button variant="outline" onClick={() => setStep('take_selfie')}>Reprendre</Button>
              <Button onClick={handleUploadSelfie} disabled={isLoading}>
                 {isLoading ? <Loader2 className="animate-spin" /> : <Upload className="mr-2" />}
                Envoyer pour validation
              </Button>
            </DialogFooter>
          </>
        );

    case 'uploading':
        return (
            <div className="flex flex-col items-center justify-center text-center h-48">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Envoi de la preuve en cours...</p>
            </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold mt-4">Preuve envoyée !</h3>
            <p className="text-muted-foreground mt-2">Votre selfie et votre position ont été envoyés à l'administrateur pour validation.</p>
            <DialogFooter className="mt-6">
                <Button onClick={onFlowComplete} className="w-full">Fermer</Button>
            </DialogFooter>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="min-h-[300px]">{renderContent()}</div>;
}
