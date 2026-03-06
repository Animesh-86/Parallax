// services/session.ts
export async function startSession(projectId: string, maxAttempts = 3): Promise<string> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("No access token found");

  const url = `http://localhost:8080/api/session/${projectId}/start`;

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[startSession] attempt ${attempt} projectId=${projectId} token=${token?.slice(0,10)}...`);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = res.headers.get("content-type") || "";
      const headersObj = Object.fromEntries(res.headers.entries());

      if (!res.ok) {
        let text = await res.text().catch(() => "");
        let serverMsg = text;
        if (contentType.includes("application/json") && text) {
          try {
            const json = JSON.parse(text);
            serverMsg = json.message || json.error || JSON.stringify(json);
          } catch (parseErr) {
            /* ignore parse error */
          }
        }

        console.error(`[startSession] attempt ${attempt} failed: status=${res.status} message=${serverMsg} headers=`, headersObj);

        // Retry transient server errors
        if ([502, 503, 504].includes(res.status) && attempt < maxAttempts) {
          await sleep(500 * attempt);
          continue;
        }

        throw new Error(`Failed to start session (${res.status}): ${serverMsg}`);
      }

      // SessionController returns JSON: { "sessionId": "..." }
      const body = await res.json();
      const sessionId = body?.sessionId;
      
      if (!sessionId) {
        throw new Error("Server returned 201 but no sessionId in response body: " + JSON.stringify(body));
      }
      
      console.log(`[startSession] succeeded: sessionId=${sessionId}`);
      return sessionId;
    } catch (err: any) {
      console.error(`[startSession] error on attempt ${attempt}:`, err);
      // Network failures (failed to fetch etc.) - retry a few times
      const isNetworkErr = err?.message?.includes("Failed to fetch") || err?.name === "TypeError" || err?.message?.toLowerCase().includes("network");
      if (isNetworkErr && attempt < maxAttempts) {
        await sleep(500 * attempt);
        continue;
      }
      throw err;
    }
  }

  throw new Error("Failed to start session: exhausted retries");
}
