/**
 * @fileOverview Server-side authentication and authorization utilities for Next.js Server Actions.
 * Since the backend does not use the firebase-admin SDK, it leverages Google's secure REST APIs
 * (Identity Toolkit and Firestore REST API) to authenticate client requests and enforce security rules.
 */

interface IdentityToolkitResponse {
  users?: Array<{
    localId: string;
    email?: string;
  }>;
}

/**
 * Verifies a client's Firebase ID token using Google's Identity Toolkit API.
 * @param idToken The Firebase ID Token sent from the client.
 * @returns The authenticated user's uid.
 * @throws Error if authentication fails or token is missing.
 */
export async function verifyIdToken(idToken: string): Promise<string> {
  if (!idToken) {
    throw new Error("Unauthorized: Firebase ID Token is required.");
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Server Configuration Error: Firebase API Key not configured.");
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Identity Toolkit ID Token lookup failed:", errText);
      throw new Error("Unauthorized: Invalid or expired Firebase ID token.");
    }

    const data: IdentityToolkitResponse = await response.json();
    const uid = data.users?.[0]?.localId;

    if (!uid) {
      throw new Error("Unauthorized: User not found in Google Identity Toolkit.");
    }

    return uid;
  } catch (error: any) {
    console.error("Error in verifyIdToken:", error.message);
    throw new Error(error.message || "Unauthorized authentication check failed.");
  }
}

/**
 * Verifies that a client user has authorized access to a specific trip document.
 * This function calls the Firestore REST API using the user's ID Token in the Authorization header.
 * By doing so, Google's servers will evaluate the request against the firestore.rules ruleset.
 * If the user is permitted by firestore.rules, the request succeeds; otherwise, it is blocked (403).
 *
 * @param idToken The client's Firebase ID token.
 * @param tripId The unique identifier of the trip document.
 * @returns True if authorized.
 * @throws Error if authorization fails or if the user lacks access.
 */
export async function verifyTripAccess(idToken: string, tripId: string): Promise<boolean> {
  if (!idToken) {
    throw new Error("Unauthorized: Firebase ID Token is required.");
  }
  if (!tripId) {
    throw new Error("Bad Request: Trip ID is required.");
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Server Configuration Error: Firebase Project ID not configured.");
  }

  // Verify the ID token first to ensure it's a valid session
  await verifyIdToken(idToken);

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/trips/${tripId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error("Unauthorized: You do not have permission to access this trip.");
      }
      if (response.status === 404) {
        throw new Error("Not Found: The requested trip was not found.");
      }
      const errText = await response.text();
      console.error("Firestore REST API trip lookup failed:", errText);
      throw new Error("Unauthorized: Trip authorization check failed.");
    }

    return true;
  } catch (error: any) {
    console.error("Error in verifyTripAccess:", error.message);
    throw new Error(error.message || "Trip authorization check failed.");
  }
}
