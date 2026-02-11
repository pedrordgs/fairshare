import { toast } from "sonner";

type CopyToClipboardOptions = {
  successMessage?: string;
  errorMessage?: string;
};

export async function copyToClipboard(
  text: string,
  { successMessage, errorMessage }: CopyToClipboardOptions = {},
): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    toast.error(
      errorMessage ?? "Couldn't copy to clipboard. Please copy it manually.",
    );
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage ?? "Copied to clipboard");
  } catch {
    toast.error(
      errorMessage ?? "Couldn't copy to clipboard. Please copy it manually.",
    );
  }
}
