import { useState } from 'react';
import { useAppDispatch } from '../../app/store';
import { googleSignIn } from './authSlice';

/**
 * The Google button's behaviour, shared by the sign-in and sign-up screens. On success the navigator switches
 * to the app by itself; an error goes to the screen's message line; closing the picker shows nothing.
 */
export function useGoogleSignIn(showError: (message: string | null) => void) {
  const dispatch = useAppDispatch();
  const [googleLoading, setGoogleLoading] = useState(false);

  const signInWithGoogle = async () => {
    showError(null);
    setGoogleLoading(true);
    const result = await dispatch(googleSignIn());
    setGoogleLoading(false);
    if (googleSignIn.rejected.match(result) && result.payload) {
      showError(result.payload.message);
    }
  };

  return { googleLoading, signInWithGoogle };
}
