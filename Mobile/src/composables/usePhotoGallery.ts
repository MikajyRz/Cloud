import { ref, watch, onMounted } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

export const usePhotoGallery = () => {
    const photos = ref<UserPhoto[]>([]);

    const PHOTO_STORAGE = 'photos';

    const addNewToGallery = async () => {
        //Take a photo
        const capturedPhoto = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100,
        });

        const fileName = Date.now() + '.jpeg';
        const savedImageFile = await savePicture(capturedPhoto, fileName);
        
        photos.value = [savedImageFile, ...photos.value];
    };

    // Compresse un blob image en JPEG base64 via canvas
    const compressImageBlob = (blob: Blob, quality = 0.6, maxWidth = 800, maxHeight = 800): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                // Redimensionnement proportionnel
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas context error');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (result) => {
                        if (result) resolve(result);
                        else reject('Compression failed');
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    };

    const savePicture =async ( photo: Photo, fileName: string): Promise<UserPhoto> => {
        const response = await fetch(photo.webPath!);
        const blob = await response.blob();
        // Compression modérée via canvas
        const compressedBlob = await compressImageBlob(blob, 0.6, 800, 800); // qualité 0.6, max 800px
        const base64Data = (await convertBlobToBase64(compressedBlob)) as string;

        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Data,
        });

        return {
            filepath: fileName,
            webviewPath: photo.webPath,
        };
    };

    const convertBlobToBase64 = ( blob: Blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.readAsDataURL(blob);
        });
    };

    const cachePhotos = () => {
        Preferences.set({
            key: PHOTO_STORAGE,
            value: JSON.stringify(photos.value),
        });
    };

    const loadSaved = async () => {
        const photoList = await Preferences.get({ key: PHOTO_STORAGE });
        const photosInPreferences =photoList.value ? JSON.parse(photoList.value) : [];
    
        for (const photo of photosInPreferences) {
            const readFile = await Filesystem.readFile({
                path: photo.filepath,
                directory: Directory.Data,
            });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        }

        photos.value = photosInPreferences;
    };

    onMounted(loadSaved);
    watch(photos, cachePhotos);

    return {
        addNewToGallery,
        photos,
    };
};

export interface UserPhoto {
    filepath: string;
    webviewPath?: string;
}