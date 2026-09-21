import type { Metadata } from "next";
import {
  getPlaceholderMetadata,
  PlaceholderRoute,
} from "@/components/layout/placeholder-route";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getPlaceholderMetadata(locale, "contact");
}

export default function ContactPage({ params }: PageProps) {
  return <PlaceholderRoute params={params} section="contact" />;
}
