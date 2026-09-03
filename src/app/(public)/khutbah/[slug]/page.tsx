import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Headphones,
  Play,
  FileText,
} from "lucide-react";
import { getKhutbahBySlug } from "@/lib/queries/public";
import { PageHeader } from "@/components/public/page-header";
import { formatDate } from "@/lib/utils/format";

interface KhutbahDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: KhutbahDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const khutbah = await getKhutbahBySlug(slug);
  if (!khutbah) return { title: "Khutbah Not Found" };
  return {
    title: khutbah.title,
    description: khutbah.description || `Khutbah by ${khutbah.speaker}`,
  };
}

export default async function KhutbahDetailPage({
  params,
}: KhutbahDetailPageProps) {
  const { slug } = await params;
  const khutbah = await getKhutbahBySlug(slug);

  if (!khutbah) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={khutbah.title} />

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/khutbah"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Khutbah
          </Link>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {/* Meta */}
            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(khutbah.date, "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {khutbah.speaker}
              </span>
            </div>

            {/* Description */}
            {khutbah.description && (
              <p className="mb-6 text-muted-foreground leading-relaxed">
                {khutbah.description}
              </p>
            )}

            {/* Article Content */}
            {khutbah.article && (
              <div className="prose prose-emerald max-w-none mb-8 whitespace-pre-line text-foreground leading-relaxed">
                {khutbah.article}
              </div>
            )}

            {/* Media Links */}
            {(khutbah.audio_url || khutbah.video_url || khutbah.pdf_url) && (
              <div className="rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Resources
                </h3>
                <div className="flex flex-wrap gap-3">
                  {khutbah.audio_url && (
                    <a
                      href={khutbah.audio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                    >
                      <Headphones className="h-4 w-4" />
                      Listen to Audio
                    </a>
                  )}
                  {khutbah.video_url && (
                    <a
                      href={khutbah.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      Watch Video
                    </a>
                  )}
                  {khutbah.pdf_url && (
                    <a
                      href={khutbah.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
