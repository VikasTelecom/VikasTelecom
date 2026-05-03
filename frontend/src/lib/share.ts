export type SharePayload = {
  title?: string;
  text?: string;
  url: string;
};

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy copy
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";

    document.body.appendChild(textarea);
    textarea.select();

    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export async function shareOrCopy(payload: SharePayload): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      // User cancelled the share sheet.
      if ((err as { name?: string } | null)?.name === "AbortError") {
        return "cancelled";
      }
      // fall back to copying
    }
  }

  const copied = await copyTextToClipboard(payload.url);
  return copied ? "copied" : "failed";
}
