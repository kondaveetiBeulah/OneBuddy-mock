import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../config';
import { updateProfileFields } from './userService';

/**
 * Uploads a profile photo picked on-device (e.g. via `expo-image-picker`)
 * to `profile-photos/{uid}.jpg` and stamps the resulting URL onto the
 * user's profile document.
 *
 * @param uid        signed-in user's id
 * @param fileUri    local `file://` URI from the image picker
 */
export async function uploadProfilePhoto(uid: string, fileUri: string): Promise<string> {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const photoRef = ref(storage, `profile-photos/${uid}.jpg`);
  await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(photoRef);
  await updateProfileFields(uid, { photoURL: url });
  return url;
}
