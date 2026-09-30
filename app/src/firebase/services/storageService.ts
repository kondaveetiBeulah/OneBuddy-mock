import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, auth } from '../config';
import { updateProfileFields } from './userService';

/**
 * Uploads a profile photo picked on-device (e.g. via `expo-image-picker`)
 * to `users/{uid}/profile/{fileId}` matching the target specification
 * and stamps the resulting URL onto the user's profile document.
 *
 * @param uid signed-in user's id
 * @param fileUri local `file://` URI from the image picker
 * @param fileId optional file identifier (defaults to `{timestamp}.jpg`)
 */
export async function uploadProfilePhoto(
  uid: string,
  fileUri: string,
  fileId?: string
): Promise<string> {
  const currentUser = auth?.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('Unauthorized: You can only upload profile photos for your own account.');
  }

  const response = await fetch(fileUri);
  const blob = await response.blob();

  // Validate file size under 10MB as required by storage rules
  const MAX_SIZE = 10 * 1024 * 1024;
  if (blob.size > MAX_SIZE) {
    throw new Error('Profile photo must be smaller than 10MB.');
  }

  const resolvedFileId = fileId || `${Date.now()}.jpg`;
  const photoRef = ref(storage, `users/${uid}/profile/${resolvedFileId}`);

  const contentType = blob.type && blob.type.startsWith('image/')
    ? blob.type
    : 'image/jpeg';

  await uploadBytes(photoRef, blob, { contentType });
  const url = await getDownloadURL(photoRef);

  try {
    await updateProfileFields(uid, { photoURL: url });
  } catch (err) {
    console.warn('[StorageService] Error stamping photoURL onto user profile:', err);
  }

  return url;
}
