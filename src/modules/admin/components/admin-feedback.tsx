"use client";

import { useEffect, useState } from "react";

type AdminFeedbackProps = {
  error?: string | null;
  success?: string | null;
};

const SUCCESS_DISMISS_MS = 5000;

export function AdminFeedback({ error, success }: AdminFeedbackProps) {
  if (error) {
    return (
      <p role="alert" className="type-caption text-destructive">
        {error}
      </p>
    );
  }

  if (success) {
    return <DismissableSuccess key={success} message={success} />;
  }

  return null;
}

function DismissableSuccess({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, SUCCESS_DISMISS_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <p role="status" className="type-caption text-secondary">
      {message}
    </p>
  );
}
