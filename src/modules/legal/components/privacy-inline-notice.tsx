import { Link } from "@/i18n/navigation";

export function PrivacyInlineNotice({
  message,
  linkLabel,
}: {
  message: string;
  linkLabel: string;
}) {
  return (
    <p className="type-caption text-muted-foreground">
      {message}{" "}
      <Link href="/aviso-de-privacidad" className="text-secondary underline-offset-4 hover:underline">
        {linkLabel}
      </Link>
    </p>
  );
}
