// Cloudflare Pages Function — checks if any Nuvio accounts are available
// Called BEFORE payment to prevent users paying when no accounts exist

interface Env {
  SMTP_EMAIL: string;
  SMTP_PASSWORD: string;
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    // We can't read Firestore from a Cloudflare Function directly
    // (Firebase web SDK needs client-side context).
    // Instead, we call the streaming API's status endpoint which is always live.
    // If the API is up, accounts might be available.

    // Actually, we can use the Firebase REST API to query Firestore.
    const projectId = "multiaddon";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "customers" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "status" },
              op: "EQUAL",
              value: { stringValue: "active" }
            }
          },
          limit: 10
        }
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ available: true, count: 0, error: "check-failed" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    // Check if any token has empty assignedTo
    let availableCount = 0;
    if (Array.isArray(data)) {
      for (const doc of data) {
        if (doc.document) {
          const fields = doc.document.fields || {};
          const assignedTo = fields.assignedTo;
          const nuvioEmail = fields.nuvioEmail;
          // Available = no assignedTo (or empty) AND has nuvioEmail
          if ((!assignedTo || assignedTo.nullValue || (assignedTo.stringValue === "")) &&
              nuvioEmail && nuvioEmail.stringValue && nuvioEmail.stringValue.trim() !== "") {
            availableCount++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ available: availableCount > 0, count: availableCount }),
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" } }
    );
  } catch (err) {
    // On error, allow payment (better to try than block)
    return new Response(
      JSON.stringify({ available: true, count: 0, error: String(err) }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};
